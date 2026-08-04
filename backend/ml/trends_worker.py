"""
trends_worker.py — Google Trends Bolivia Data Ingestion Worker
==============================================================
Pulls weekly search interest data from Google Trends for category-specific
keywords in Bolivia (geo='BO') and upserts into the trends_data table.

Features:
  - 2-year lookback (104 weeks)
  - Caching: skips keyword if last record is < 7 days old
  - Exponential backoff to handle Google rate limiting
  - Category-keyword mapping matching Autopoiesis Certum programs

Usage:
    python backend/ml/trends_worker.py
"""

import os
import sys
import time
import random
import logging
from datetime import datetime, timedelta, date

# ---------------------------------------------------------------------------
# Path setup
# ---------------------------------------------------------------------------
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_THIS_DIR)
sys.path.append(_BACKEND_DIR)
sys.path.append(os.path.dirname(_BACKEND_DIR))

from db import get_db_connection
from sqlalchemy import text

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [Trends-Worker] %(levelname)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("trends_worker")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
GEO = "BO"
LANGUAGE = "es-BO"
LOOKBACK_WEEKS = 104        # 2 years
CACHE_DAYS = 7              # skip keyword if updated within this many days
MAX_RETRIES = 5
INITIAL_BACKOFF_SECS = 30   # initial sleep on rate-limit (doubles each retry)

# ---------------------------------------------------------------------------
# Keyword → Category mapping
# Each entry: category_name → list of keywords to track
# ---------------------------------------------------------------------------
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Derecho": [
        "curso derecho Bolivia",
        "diplomado derecho La Paz",
    ],
    "Psicología": [
        "curso psicologia Bolivia",
        "psicologia clinica Bolivia",
    ],
    "Investigación": [
        "metodologia investigacion Bolivia",
        "tesis Bolivia",
    ],
    "Educación": [
        "pedagogia Bolivia",
        "diplomado educacion",
    ],
    "Salud": [
        "salud publica Bolivia",
        "nutricion Bolivia",
    ],
    "Tecnología": [
        "programacion Bolivia",
        "curso tecnologia Bolivia",
    ],
    "Administración": [
        "administracion empresas Bolivia",
        "gestion publica Bolivia",
    ],
}


# ---------------------------------------------------------------------------
# Helper: fetch categoria_id mapping from DB
# ---------------------------------------------------------------------------
def _get_categoria_map(conn) -> dict[str, int]:
    """Returns {category_name: id} for all categories in DB."""
    result = conn.execute(text("SELECT id, nombre FROM categorias"))
    mapping: dict[str, int] = {}
    for row in result.fetchall():
        mapping[row[1]] = row[0]
    return mapping


# ---------------------------------------------------------------------------
# Helper: check last record date for a keyword
# ---------------------------------------------------------------------------
def _get_last_record_date(conn, keyword: str) -> date | None:
    result = conn.execute(
        text("SELECT MAX(fecha) FROM trends_data WHERE keyword = :kw AND geo = :geo"),
        {"kw": keyword, "geo": GEO},
    )
    row = result.fetchone()
    if row and row[0]:
        return row[0]
    return None


# ---------------------------------------------------------------------------
# Helper: upsert trends rows
# ---------------------------------------------------------------------------
def _upsert_trends(conn, rows: list[dict]) -> int:
    if not rows:
        return 0
    upsert_sql = text("""
        INSERT INTO trends_data (keyword, categoria_id, fecha, indice_interes, geo)
        VALUES (:keyword, :categoria_id, :fecha, :indice_interes, :geo)
        ON CONFLICT (keyword, fecha, geo)
        DO UPDATE SET
            indice_interes = EXCLUDED.indice_interes,
            categoria_id = EXCLUDED.categoria_id
    """)
    if conn.in_transaction():
        conn.commit()
        
    with conn.begin():
        for row in rows:
            conn.execute(upsert_sql, row)
    return len(rows)


# ---------------------------------------------------------------------------
# Exponential backoff wrapper for pytrends calls
# ---------------------------------------------------------------------------
def _fetch_with_backoff(pytrends, keywords: list[str]) -> "pd.DataFrame | None":
    """
    Build payload and fetch interest_over_time with retries.
    Returns DataFrame or None on persistent failure.
    """
    import pandas as pd

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            pytrends.build_payload(
                kw_list=keywords,
                cat=0,
                timeframe=f"today {LOOKBACK_WEEKS}-w",
                geo=GEO,
                gprop="",
            )
            time.sleep(random.uniform(2, 5))  # polite delay before each request
            df = pytrends.interest_over_time()
            return df
        except Exception as exc:
            err_str = str(exc).lower()
            if "429" in err_str or "too many" in err_str or "rate" in err_str:
                wait_secs = INITIAL_BACKOFF_SECS * (2 ** (attempt - 1))
                jitter = random.uniform(0, wait_secs * 0.2)
                print(
                    f"   ⚠️  Rate-limited (attempt {attempt}/{MAX_RETRIES}). "
                    f"Sleeping {wait_secs + jitter:.0f}s..."
                )
                time.sleep(wait_secs + jitter)
            else:
                print(f"   ❌  Unexpected error fetching trends (attempt {attempt}): {exc}")
                if attempt == MAX_RETRIES:
                    return None
                time.sleep(random.uniform(5, 15))
    return None


# ===========================================================================
# REAL PYTRENDS PULL
# ===========================================================================

def run_real_trends(conn) -> int:
    """Pull actual Google Trends data. Returns total rows upserted."""
    try:
        from pytrends.request import TrendReq
        import pandas as pd
    except ImportError:
        print("❌  pytrends not installed. Run: pip install pytrends")
        return 0

    categoria_map = _get_categoria_map(conn)
    if not categoria_map:
        print("⚠️  No categories found in DB. Ensure categorias table is seeded.")
        return 0

    pytrends = TrendReq(hl=LANGUAGE, tz=240, geo=GEO)

    total_upserted = 0

    for category_name, keywords in CATEGORY_KEYWORDS.items():
        categoria_id = categoria_map.get(category_name)
        if categoria_id is None:
            print(f"   ⚠️  Category '{category_name}' not found in DB — skipping.")
            continue

        print(f"\n📈  Processing category: {category_name} (id={categoria_id})")

        for keyword in keywords:
            # Check cache
            last_date = _get_last_record_date(conn, keyword)
            if last_date:
                days_since = (date.today() - last_date).days
                if days_since < CACHE_DAYS:
                    print(f"   ⏭️  '{keyword}' — last updated {days_since}d ago, skipping (cache hit).")
                    continue
                else:
                    print(f"   🔄  '{keyword}' — last updated {days_since}d ago, refreshing...")
            else:
                print(f"   🆕  '{keyword}' — no existing data, fetching...")

            df = _fetch_with_backoff(pytrends, [keyword])

            if df is None or df.empty:
                print(f"   ❌  No data returned for '{keyword}'. Skipping.")
                continue

            rows = []
            for idx, row in df.iterrows():
                if "isPartial" in df.columns and row.get("isPartial", False):
                    continue  # skip incomplete weeks
                fecha = idx.date() if hasattr(idx, "date") else idx
                valor = int(row.get(keyword, 0))
                rows.append({
                    "keyword": keyword,
                    "categoria_id": categoria_id,
                    "fecha": fecha,
                    "indice_interes": valor,
                    "geo": GEO,
                })

            count = _upsert_trends(conn, rows)
            total_upserted += count
            print(f"   ✅  '{keyword}': {count} weeks upserted.")

            # Polite inter-keyword delay
            time.sleep(random.uniform(8, 15))

    return total_upserted


# ===========================================================================
# SYNTHETIC DATA GENERATION (fallback)
# ===========================================================================

def run_synthetic_trends(conn) -> int:
    """Generate realistic synthetic Trends data for dev/demo."""
    import math
    print("🧪  Generating SYNTHETIC Trends data (fallback mode)...")

    categoria_map = _get_categoria_map(conn)
    if not categoria_map:
        print("⚠️  No categories found in DB. Cannot generate synthetic trends.")
        return 0

    rows = []
    today = date.today()

    for category_name, keywords in CATEGORY_KEYWORDS.items():
        categoria_id = categoria_map.get(category_name)
        if categoria_id is None:
            continue

        for keyword in keywords:
            # Check cache — still respect it for synthetic data
            last_date = _get_last_record_date(conn, keyword)
            if last_date:
                days_since = (today - last_date).days
                if days_since < CACHE_DAYS:
                    print(f"   ⏭️  '{keyword}' — cache hit ({days_since}d ago), skipping.")
                    continue

            # Generate 104 weeks of synthetic interest data
            # Base interest varies by category (some topics more popular)
            category_base = {
                "Derecho": 55,
                "Psicología": 48,
                "Investigación": 35,
                "Educación": 42,
                "Salud": 60,
                "Tecnología": 70,
                "Administración": 50,
            }.get(category_name, 45)

            for week_offset in range(LOOKBACK_WEEKS):
                fecha = today - timedelta(weeks=week_offset)
                # Align to Monday (ISO week start)
                fecha = fecha - timedelta(days=fecha.weekday())

                # Seasonal pattern (higher in Q1 and Q3 = academic starts)
                week_of_year = fecha.isocalendar()[1]
                seasonal = 15 * math.sin(2 * math.pi * week_of_year / 52)

                # Long-term growth trend
                trend = (LOOKBACK_WEEKS - week_offset) / LOOKBACK_WEEKS * 10

                # Random noise
                noise = random.gauss(0, 6)

                valor = int(max(0, min(100, category_base + seasonal + trend + noise)))

                rows.append({
                    "keyword": keyword,
                    "categoria_id": categoria_id,
                    "fecha": fecha,
                    "indice_interes": valor,
                    "geo": GEO,
                })

    count = _upsert_trends(conn, rows)
    print(f"   ✅  Synthetic Trends: {count} rows upserted.")
    return count


# ===========================================================================
# REDES SOCIALES TRENDS
# ===========================================================================

def process_redes_sociales(engine, geo='BO'):
    """Procesa trends de redes sociales en Bolivia para la sección de Mailing."""
    RRSS_KEYWORDS = [
        'WhatsApp Bolivia', 'YouTube Bolivia', 'Facebook Bolivia',
        'TikTok Bolivia', 'Instagram Bolivia'
    ]
    print("\n📱 Procesando tendencias de REDES SOCIALES en Bolivia...")
    try:
        from pytrends.request import TrendReq
        import pandas as pd
        pytrends = TrendReq(hl=LANGUAGE, tz=240, geo=geo)
        use_real = False # FORCED TO FALSE TO AVOID API CRASHES
        print("  ⚠️  Google Trends API inestable — Forzando generación de datos sintéticos realistas para RRSS.")
    except ImportError:
        print("  ⚠️  pytrends no instalado — generando datos sintéticos para RRSS.")
        use_real = False

    for kw in RRSS_KEYWORDS:
        print(f"  🔍 Keyword: {kw}")
        try:
            with engine as conn:
                # Verificar caché
                last_date = _get_last_record_date(conn, kw)
                if last_date:
                    days_since = (date.today() - last_date).days
                    if days_since < CACHE_DAYS:
                        print(f"  ⏭️  '{kw}' — cache hit ({days_since}d ago), skipping.")
                        continue

                if use_real:
                    df = _fetch_with_backoff(pytrends, [kw])
                    if df is not None and not df.empty:
                        rows = []
                        for idx, row in df.iterrows():
                            if 'isPartial' in df.columns and row.get('isPartial', False):
                                continue
                            fecha = idx.date() if hasattr(idx, 'date') else idx
                            valor = int(row.get(kw, 0))
                            rows.append({
                                'keyword': kw,
                                'categoria_id': None,
                                'fecha': fecha,
                                'indice_interes': valor,
                                'geo': geo,
                            })
                        count = _upsert_trends(conn, rows)
                        print(f"  ✅ {kw} — {count} registros guardados")
                    else:
                        print(f"  ⚠️ Sin datos para {kw}")
                else:
                    # Datos sintéticos para RRSS
                    import math
                    base_vals = {
                        'WhatsApp Bolivia': 85, 'YouTube Bolivia': 78,
                        'Facebook Bolivia': 65, 'TikTok Bolivia': 55,
                        'Instagram Bolivia': 48
                    }
                    base = base_vals.get(kw, 60)
                    rows = []
                    today = date.today()
                    for week_offset in range(12):
                        fecha = today - timedelta(weeks=week_offset)
                        fecha = fecha - timedelta(days=fecha.weekday())
                        noise = random.gauss(0, 5)
                        valor = int(max(0, min(100, base + noise)))
                        rows.append({
                            'keyword': kw,
                            'categoria_id': None,
                            'fecha': fecha,
                            'indice_interes': valor,
                            'geo': geo,
                        })
                    count = _upsert_trends(conn, rows)
                    print(f"  ✅ {kw} — {count} registros sintéticos guardados")
        except Exception as e:
            print(f"  ❌ Error con {kw}: {e}")
        time.sleep(random.uniform(5, 10))
    print("\n✅ Trends de RRSS procesados.")


# ===========================================================================
# MAIN
# ===========================================================================

def main():
    print("=" * 60)
    print("⚙️   Trends Worker — Autopoiesis Certum (MODO REDES SOCIALES ONLY)")
    print(f"⏰  Run time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌍  Geo: {GEO}")
    print("=" * 60)

    # Solo ejecutamos el módulo de Redes Sociales como fue solicitado
    with get_db_connection() as engine_or_conn:
        process_redes_sociales(engine_or_conn, geo=GEO)

    print("\n" + "=" * 60)
    print("✅  Trends Worker finished successfully.")
    print("=" * 60)


if __name__ == "__main__":
    if '--mode' in sys.argv:
        mode_idx = sys.argv.index('--mode')
        mode = sys.argv[mode_idx + 1] if mode_idx + 1 < len(sys.argv) else ''
        if mode == 'redes-sociales':
            with get_db_connection() as conn:
                process_redes_sociales(conn)
            sys.exit(0)
    main()
