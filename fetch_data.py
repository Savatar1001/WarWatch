#!/usr/bin/env python3
"""
WarWatch — Automated data fetcher
Runs every 30 minutes via GitHub Actions.
Scrapes Wikipedia, Al Jazeera RSS, Reuters RSS, NewsAPI, and OilPriceAPI.
Injects live data into index.html — GitHub Actions commits & deploys to GitHub Pages.
"""

import os
import re
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ── API keys from GitHub Secrets ──
OIL_API_KEY  = os.environ.get('OIL_API_KEY', '')
NEWS_API_KEY = os.environ.get('NEWS_API_KEY', '')  # optional — graceful fallback if not set yet

# ── War start date ──
WAR_START = datetime(2026, 2, 28, tzinfo=timezone.utc)


# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def fetch_url(url, headers=None, timeout=15):
    """Fetch a URL and return the response body as a string."""
    req = urllib.request.Request(url, headers=headers or {
        'User-Agent': 'WarWatch-Bot/1.0 (https://iranwarstats.info; automated news aggregator)'
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read().decode('utf-8', errors='replace')
    except Exception as e:
        print(f"  [WARN] Failed to fetch {url}: {e}")
        return ''


def safe_num(s):
    """Extract first number from a string."""
    m = re.search(r'[\d,]+', str(s))
    return m.group(0).replace(',', '') if m else '?'


def html_strip(s):
    """Remove HTML tags from a string."""
    return re.sub(r'<[^>]+>', '', s).strip()


def escape_js(s):
    """Escape a string for safe injection into JS template literal."""
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')


# ─────────────────────────────────────────
# 1. OIL PRICES
# ─────────────────────────────────────────

def fetch_oil_prices():
    print("Fetching oil prices...")
    result = {
        'brent': '—', 'brent_change': '—',
        'wti': '—',   'wti_change': '—',
        'source': 'oilpriceapi.com'
    }
    brent, wti = None, None

    # ── Primary: oilpriceapi.com (requires OIL_API_KEY) ──
    if OIL_API_KEY:
        try:
            url = 'https://api.oilpriceapi.com/v1/prices/latest?by_code=BRENT_CRUDE_USD'
            data = json.loads(fetch_url(url, headers={
                'Authorization': f'Token {OIL_API_KEY}',
                'User-Agent': 'WarWatch-Bot/1.0'
            }))
            brent = float(data['data']['price'])
            url2 = 'https://api.oilpriceapi.com/v1/prices/latest?by_code=WTI_USD'
            data2 = json.loads(fetch_url(url2, headers={
                'Authorization': f'Token {OIL_API_KEY}',
                'User-Agent': 'WarWatch-Bot/1.0'
            }))
            wti = float(data2['data']['price'])
            result['source'] = 'oilpriceapi.com'
            print("  [OK] oilpriceapi.com")
        except Exception as e:
            print(f"  [WARN] oilpriceapi.com failed: {e} — trying fallback")

    # ── Fallback: EIA open data (no key required, daily prices) ──
    if brent is None or wti is None:
        try:
            # EIA series: RBRTE = Brent, RWTC = WTI, daily frequency
            eia_url = ('https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=DEMO'
                       '&frequency=daily&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=1')
            # Try Brent
            brent_url = 'https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=DEMO&frequency=daily&data[0]=value&facets[series][]=RBRTE&sort[0][column]=period&sort[0][direction]=desc&length=1'
            wti_url   = 'https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=DEMO&frequency=daily&data[0]=value&facets[series][]=RWTC&sort[0][column]=period&sort[0][direction]=desc&length=1'
            bd = json.loads(fetch_url(brent_url))
            brent = float(bd['response']['data'][0]['value'])
            wd = json.loads(fetch_url(wti_url))
            wti = float(wd['response']['data'][0]['value'])
            result['source'] = 'eia.gov'
            print("  [OK] EIA fallback")
        except Exception as e2:
            print(f"  [WARN] EIA fallback also failed: {e2}")

    # ── Populate result ──
    if brent is not None:
        result['brent'] = f'${brent:.2f}'
        brent_pct = ((brent - 67) / 67) * 100
        result['brent_change'] = f'{"+" if brent_pct >= 0 else ""}{brent_pct:.1f}% vs pre-war'
    if wti is not None:
        result['wti'] = f'${wti:.2f}'
        wti_pct = ((wti - 63) / 63) * 100
        result['wti_change'] = f'{"+" if wti_pct >= 0 else ""}{wti_pct:.1f}% vs pre-war'

    print(f"  Brent: {result['brent']} ({result['brent_change']})")
    print(f"  WTI:   {result['wti']} ({result['wti_change']})")
    return result


# ─────────────────────────────────────────
# 2. WIKIPEDIA SCRAPE
# ─────────────────────────────────────────

def fetch_wikipedia():
    print("Fetching Wikipedia data...")
    result = {
        'casualties_iran_official': 'Updating...',
        'casualties_hengaw': 'Updating...',
        'casualties_hrana': 'Updating...',
        'casualties_injured': 'Updating...',
        'strikes_total': 'Updating...',
        'missile_waves': 'Updating...',
        'drones_total': 'Updating...',
        'nuclear_natanz': 'Unknown',
        'nuclear_uranium': 'Unknown',
        'nuclear_iaea': 'Unknown',
        'war_day': '—',
        'displaced': 'Updating...',
        'countries_attacked': 'Updating...',
    }
    try:
        api_url = (
            'https://en.wikipedia.org/w/api.php?action=parse&page=2026_Iran%E2%80%93United_States_war'
            '&prop=wikitext&format=json&formatversion=2'
        )
        raw = fetch_url(api_url)
        data = json.loads(raw)
        wikitext = data.get('parse', {}).get('wikitext', '')

        if not wikitext:
            html = fetch_url('https://en.wikipedia.org/wiki/2026_Iran%E2%80%93United_States_war')
            wikitext = html

        # ── War day count ──
        now = datetime.now(timezone.utc)
        days = (now - WAR_START).days + 1
        result['war_day'] = str(days)

        # ── Casualties ──
        cas_match = re.findall(r'casualties[12]?\s*=\s*([^\n\|]{5,120})', wikitext, re.IGNORECASE)
        for m in cas_match:
            clean = html_strip(m).strip()
            if clean and len(clean) > 3:
                if 'health' in clean.lower() or 'official' in clean.lower() or ('1,' in clean and 'killed' in clean.lower()):
                    result['casualties_iran_official'] = clean[:80]
                elif 'hengaw' in clean.lower():
                    result['casualties_hengaw'] = clean[:80]
                elif 'hrana' in clean.lower():
                    result['casualties_hrana'] = clean[:80]

        killed_matches = re.findall(r'(\d[\d,]+)\s*(?:killed|dead|death)', wikitext, re.IGNORECASE)
        if killed_matches and result['casualties_iran_official'] == '—':
            result['casualties_iran_official'] = killed_matches[0].replace(',', '') + ' killed (official)'

        injured_matches = re.findall(r'(\d[\d,]+)\s*(?:injured|wounded)', wikitext, re.IGNORECASE)
        if injured_matches:
            result['casualties_injured'] = injured_matches[0].replace(',', '') + '+'

        # ── Strikes ──
        strike_patterns = [
            r'(\d[\d,]+)\+?\s*(?:targets?|strikes?|sites?|locations?|facilities?)\s*(?:struck|hit|bombed|attacked|destroyed)',
            r'(?:struck|hit|bombed|attacked|destroyed)\s*(\d[\d,]+)\+?\s*(?:targets?|sites?|locations?|facilities?)',
            r'(\d[\d,]+)\+?\s*(?:airstrikes?|air\s*strikes?)',
            r'(?:more\s+than|over|at\s+least)\s+(\d[\d,]+)\s+(?:targets?|strikes?|sites?)',
            r'(\d[\d,]+)\s*\+\s*(?:targets?|strikes?)',
        ]
        for pat in strike_patterns:
            strike_matches = re.findall(pat, wikitext, re.IGNORECASE)
            if strike_matches:
                val = [m for m in strike_matches if m][0]
                result['strikes_total'] = val.replace(',', '') + '+'
                break

        # ── Missile waves ──
        wave_patterns = [
            r'(\d+)\+?\s*(?:waves?|rounds?|salvos?)\s*of\s*(?:missile|attack|drone|rocket)',
            r'(?:missile|drone|rocket)\s*(?:waves?|attacks?|salvos?)\s*[:\-]?\s*(\d+)',
            r'(\d+)\s*(?:separate\s+)?(?:missile|drone)\s*(?:waves?|attacks?|barrages?)',
        ]
        for pat in wave_patterns:
            wave_matches = re.findall(pat, wikitext, re.IGNORECASE)
            if wave_matches:
                result['missile_waves'] = wave_matches[0] + '+'
                break

        # ── Drones ──
        drone_patterns = [
            r'(\d[\d,]+)\+?\s*(?:UAVs?|drones?|shaheds?)\s*(?:launched|fired|deployed|used|sent)',
            r'(?:launched|fired|deployed|used)\s*(\d[\d,]+)\+?\s*(?:UAVs?|drones?|shaheds?)',
            r'(\d[\d,]+)\s*(?:UAVs?|drones?)',
        ]
        for pat in drone_patterns:
            drone_matches = re.findall(pat, wikitext, re.IGNORECASE)
            if drone_matches:
                result['drones_total'] = drone_matches[0].replace(',', '') + '+'
                break

        # ── Displaced ──
        disp_matches = re.findall(r'(\d[\d,.]+\s*(?:million|M)?)\s*(?:internally\s*)?displaced', wikitext, re.IGNORECASE)
        if disp_matches:
            result['displaced'] = disp_matches[0].strip()

        # ── Nuclear ──
        if re.search(r'natanz.{0,100}struck|struck.{0,100}natanz', wikitext, re.IGNORECASE):
            result['nuclear_natanz'] = 'Struck'
        if re.search(r'natanz.{0,100}intact|natanz.{0,100}undamaged', wikitext, re.IGNORECASE):
            result['nuclear_natanz'] = 'Reportedly intact'

        if re.search(r'uranium.{0,100}unknown|location.{0,100}unknown', wikitext, re.IGNORECASE):
            result['nuclear_uranium'] = 'Location unknown'
        if re.search(r'408|enriched uranium', wikitext, re.IGNORECASE):
            result['nuclear_uranium'] = '408.6kg 60%-enriched — location unconfirmed'

        if re.search(r'iaea.{0,100}suspend|iaea.{0,100}unable', wikitext, re.IGNORECASE):
            result['nuclear_iaea'] = 'Verification suspended'
        if re.search(r'iaea.{0,100}concern|iaea.{0,100}warn', wikitext, re.IGNORECASE):
            result['nuclear_iaea'] = 'Warning issued'

        print(f"  Day: {result['war_day']}")
        print(f"  Strikes: {result['strikes_total']}")
        print(f"  Casualties (official): {result['casualties_iran_official']}")
        print(f"  Nuclear Natanz: {result['nuclear_natanz']}")

    except Exception as e:
        print(f"  [WARN] Wikipedia fetch failed: {e}")
        # Set unfilled fields to source unavailable rather than Updating...
        for key in result:
            if result[key] == 'Updating...':
                result[key] = 'Source unavailable'

    # Replace any remaining Updating... with source unavailable
    for key in result:
        if result[key] == 'Updating...':
            result[key] = 'Source unavailable'

    return result


# ─────────────────────────────────────────
# 3. HEADLINES CACHE (persistent store)
# ─────────────────────────────────────────

CACHE_FILE = Path('headlines_cache.json')
def load_cache():
    """Load cached headlines dict keyed by URL."""
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text(encoding='utf-8'))
        except Exception:
            pass
    return {}

def save_cache(cache: dict):
    """Save full headlines cache — no cap, browser never loads this file."""
    CACHE_FILE.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding='utf-8')


# ─────────────────────────────────────────
# 4. RSS NEWS FEEDS
# ─────────────────────────────────────────

RSS_FEEDS = [
    ('Al Jazeera',   'https://www.aljazeera.com/xml/rss/all.xml'),
    ('BBC',          'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml'),
    ('Reuters',      'https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com+Iran+war&ceid=US:en&hl=en-US&gl=US'),
    ('Associated Press', 'https://news.google.com/rss/search?q=when:24h+allinurl:apnews.com+Iran&ceid=US:en&hl=en-US&gl=US'),
    ('The Guardian', 'https://www.theguardian.com/world/middleeast/rss'),
    ('France 24',    'https://www.france24.com/en/middle-east/rss'),
]

IRAN_KEYWORDS = [
    'iran', 'iranian', 'tehran', 'hormuz', 'natanz', 'irgc', 'khamenei',
    'persian gulf', 'us strike', 'israel strike', 'nuclear', 'strait',
    'oil price', 'brent', 'centcom', 'hegseth', 'dimona', 'fordow',
    'pasdaran', 'revolutionary guard', 'khuzestan', 'bushehr',
    'gulf states', 'gulf war', 'iran war', 'operation epic fury',
    'missile strike', 'drone attack', 'hezbollah', 'houthi'
]

def fetch_newsapi(seen: set):
    """Fetch Iran war headlines from NewsAPI — covers full history since war start."""
    if not NEWS_API_KEY:
        print("  [INFO] NEWS_API_KEY not set — skipping NewsAPI")
        return []

    print("Fetching NewsAPI headlines...")
    all_items = []

    # NewsAPI free tier: 100 req/day, 30-day history
    # Use 3-day chunks + pagination to maximise coverage
    war_start = datetime(2026, 2, 28, tzinfo=timezone.utc)
    now       = datetime.now(timezone.utc)
    chunk     = timedelta(days=3)

    queries = [
        'Iran war US strikes',
        'Iran nuclear Natanz',
        'Operation Epic Fury',
    ]

    for query in queries:
        from_date = war_start
        while from_date < now:
            to_date = min(from_date + chunk, now)
            page = 1
            while True:
                params = urllib.parse.urlencode({
                    'q':        query,
                    'from':     from_date.strftime('%Y-%m-%d'),
                    'to':       to_date.strftime('%Y-%m-%d'),
                    'language': 'en',
                    'sortBy':   'publishedAt',
                    'pageSize': 100,
                    'page':     page,
                    'apiKey':   NEWS_API_KEY,
                })
                url = f'https://newsapi.org/v2/everything?{params}'
                raw = fetch_url(url)
                if not raw:
                    break

                try:
                    data     = json.loads(raw)
                    articles = data.get('articles', [])
                    print(f"  NewsAPI '{query}' {from_date.date()}→{to_date.date()} p{page}: {len(articles)} articles")

                    for art in articles:
                        title   = (art.get('title') or '').strip()
                        desc    = (art.get('description') or '').strip()
                        link    = art.get('url', '')
                        pub_raw = art.get('publishedAt', '')
                        source  = (art.get('source', {}) or {}).get('name', 'NewsAPI')

                        if not title or title == '[Removed]':
                            continue
                        if link in seen:
                            continue

                        source_map = {
                            'Al Jazeera English': 'Al Jazeera',
                            'Reuters':            'Reuters',
                            'BBC News':           'BBC',
                            'The Guardian':       'The Guardian',
                            'France 24':          'France 24',
                            'Associated Press':   'Associated Press',
                        }
                        source = source_map.get(source, source)

                        pub_iso = pub_raw[:10] if pub_raw else ''

                        combined = (title + ' ' + desc).lower()
                        if any(kw in combined for kw in IRAN_KEYWORDS):
                            all_items.append({
                                'title':   html_strip(title)[:160],
                                'desc':    html_strip(desc)[:240],
                                'link':    link,
                                'pub':     pub_raw,
                                'pub_iso': pub_iso,
                                'source':  source,
                            })
                            if link:
                                seen.add(link)

                    # If fewer than 100 returned, no more pages
                    if len(articles) < 100:
                        break
                    page += 1

                except Exception as e:
                    print(f"  [WARN] NewsAPI parse error: {e}")
                    break

            from_date = to_date

    print(f"  NewsAPI total: {len(all_items)} new articles")
    return all_items




def fetch_rss_news(seen: set):
    print("Fetching RSS news feeds...")
    all_items = []

    for source_name, feed_url in RSS_FEEDS:
        try:
            xml_text = fetch_url(feed_url)
            if not xml_text:
                continue
            root = ET.fromstring(xml_text)
            ns   = {'atom': 'http://www.w3.org/2005/Atom'}

            items = root.findall('.//item') or root.findall('.//atom:entry', ns)

            for item in items[:30]:
                title = (
                    getattr(item.find('title'), 'text', '') or
                    getattr(item.find('atom:title', ns), 'text', '') or ''
                ).strip()
                desc = (
                    getattr(item.find('description'), 'text', '') or
                    getattr(item.find('summary'), 'text', '') or
                    getattr(item.find('atom:summary', ns), 'text', '') or ''
                )
                link = (
                    getattr(item.find('link'), 'text', '') or
                    (item.find('atom:link', ns) or item.find('link')).get('href', '') if item.find('link') is not None else ''
                )
                pub = (
                    getattr(item.find('pubDate'), 'text', '') or
                    getattr(item.find('atom:published', ns), 'text', '') or ''
                )

                # Parse to ISO date for JS sorting
                pub_iso = ''
                for fmt in ('%a, %d %b %Y %H:%M:%S %z', '%a, %d %b %Y %H:%M:%S GMT',
                            '%Y-%m-%dT%H:%M:%S%z', '%Y-%m-%dT%H:%M:%SZ'):
                    try:
                        pub_iso = datetime.strptime(pub.strip(), fmt).strftime('%Y-%m-%d')
                        break
                    except Exception:
                        continue

                combined = (title + ' ' + html_strip(desc)).lower()
                if any(kw in combined for kw in IRAN_KEYWORDS):
                    all_items.append({
                        'title':   html_strip(title)[:160],
                        'desc':    html_strip(desc)[:240],
                        'link':    link,
                        'pub':     pub[:30],
                        'pub_iso': pub_iso,
                        'source':  source_name,
                    })

        except Exception as e:
            print(f"  [WARN] RSS feed {source_name} failed: {e}")

    # Deduplicate by title similarity
    seen_titles = []
    unique = []
    for item in all_items:
        # Skip if URL already processed in a previous run
        if item['link'] and item['link'] in seen:
            continue
        title_words = set(item['title'].lower().split())
        is_dup = any(
            len(title_words & set(s['title'].lower().split())) > 5
            for s in seen_titles
        )
        if not is_dup and item['title']:
            unique.append(item)
            seen_titles.append(item)
            if item['link']:
                seen.add(item['link'])  # mark as seen for future runs

    print(f"  Found {len(unique)} new relevant headlines")
    return unique[:300]


# ─────────────────────────────────────────
# 4. BUILD TICKER + EVENTS HTML
# ─────────────────────────────────────────

def build_ticker(news_items):
    if not news_items:
        return '⚡ Live updates loading... <span class="ticker-sep">◆</span> '

    ticker_parts = []
    for item in news_items[:12]:
        src = item['source']
        title = escape_js(item['title'])
        ticker_parts.append(f'⚡ {title} <span class="ticker-sep">◆</span> <span class="ticker-source">— {src}</span>')

    combined = ' &nbsp; '.join(ticker_parts)
    return combined + ' &nbsp; ' + combined


def build_events_html(news_items):
    if not news_items:
        return '<div class="event-item"><div class="event-time">—</div><div class="event-pip" style="background:var(--white3)"></div><div class="event-body"><div class="event-text">Loading latest events...</div></div></div>'

    html_parts = []
    for item in news_items:
        source  = escape_js(item['source'])
        title   = escape_js(item['title'])
        desc    = escape_js(item['desc'])
        link    = item.get('link', '#')
        pub     = item.get('pub', '')[:16]

        text_lower = title.lower()
        if any(w in text_lower for w in ['strike', 'attack', 'hit', 'bomb', 'kill', 'nuclear', 'missile']):
            pip_color = 'var(--red)'
            tag_class = 'et-strike'
            tag_label = 'Airstrike'
        elif any(w in text_lower for w in ['oil', 'brent', 'energy', 'price', 'economic']):
            pip_color = 'var(--gold)'
            tag_class = 'et-energy'
            tag_label = 'Energy/Oil'
        elif any(w in text_lower for w in ['intercept', 'defense', 'destroy', 'shoot']):
            pip_color = 'var(--green)'
            tag_class = 'et-intercept'
            tag_label = 'Intercepted'
        else:
            pip_color = 'var(--blue)'
            tag_class = 'et-diplo'
            tag_label = 'Diplomatic'

        pub_iso = item.get('pub_iso', '')
        display_date = pub_iso if pub_iso else pub[:10]

        html_parts.append(f'''    <div class="event-item" data-source="{source}" data-date="{pub_iso}">
      <div class="event-time">{display_date}</div>
      <div class="event-src">{source}</div>
      <div class="event-body">
        <span class="event-tag {tag_class}">{tag_label}<span class="ev-tip">{_tag_tip(tag_label)}</span></span>
        <div class="event-text"><a href="{link}" target="_blank" rel="noopener" class="event-link" title="{title}">{title}</a></div>
      </div>
    </div>''')

    return '\n'.join(html_parts)


def _tag_tip(label):
    tips = {
        'Airstrike':   'A military strike, missile attack or drone operation carried out by either side',
        'Energy/Oil':  'Impact on oil prices, gas supplies, refineries, shipping lanes or energy infrastructure',
        'Intercepted': 'A missile, drone or projectile that was shot down or neutralised before reaching its target',
        'Diplomatic':  'Political developments, peace talks, sanctions, humanitarian events or general war news',
    }
    return tips.get(label, '')


# ─────────────────────────────────────────
# 5. INJECT DATA INTO HTML
# ─────────────────────────────────────────

def fetch_exchange_rates():
    """Fetch live USD exchange rates from open.er-api.com (free, no key)."""
    defaults = {'eur': 0.92, 'gbp': 0.79, 'cny': 7.23, 'jpy': 149.5, 'zar': 18.6}
    try:
        raw = fetch_url('https://open.er-api.com/v6/latest/USD')
        if not raw:
            return defaults
        data = json.loads(raw)
        rates = data.get('rates', {})
        return {
            'eur': round(rates.get('EUR', defaults['eur']), 4),
            'gbp': round(rates.get('GBP', defaults['gbp']), 4),
            'cny': round(rates.get('CNY', defaults['cny']), 4),
            'jpy': round(rates.get('JPY', defaults['jpy']), 4),
            'zar': round(rates.get('ZAR', defaults['zar']), 4),
        }
    except Exception as e:
        print(f"  [WARN] Exchange rate fetch failed: {e}")
        return defaults


def inject_data(html, oil, wiki, news, fx=None):
    now_utc = datetime.now(timezone.utc).strftime('%d %b %Y %H:%M UTC')
    deploy_ver = datetime.now(timezone.utc).strftime('%Y%m%d%H%M')

    # ── Exchange rates (FX object in JS) ──
    if fx:
        fx_js = f"{{ eur: {fx['eur']}, gbp: {fx['gbp']}, cny: {fx['cny']}, jpy: {fx['jpy']}, zar: {fx['zar']} }}"
        html = re.sub(
            r'const FX\s*=\s*\{[^}]+\};',
            f'const FX = {fx_js};',
            html
        )
        all_fx_replacements = {
            'EUR': fx['eur'], 'GBP': fx['gbp'], 'CNY': fx['cny'],
            'JPY': fx['jpy'], 'ZAR': fx['zar']
        }
        for code, rate in all_fx_replacements.items():
            html = re.sub(
                rf'({code}:\{{r:)[0-9.]+',
                rf'\g<1>{rate}',
                html
            )

    # ── Layout version ──
    html = re.sub(
        r"const CURRENT_VER\s*=\s*'[^']*';.*",
        f"const CURRENT_VER   = '{deploy_ver}'; // auto-set by fetch_data.py",
        html
    )

    # ── War day ──
    html = re.sub(r'id="day-count">[^<]*<', f'id="day-count">{wiki["war_day"]}<', html)

    # ── Update timestamp ──
    html = re.sub(
        r'(Data as of:.*?<strong id="update-time"[^>]*>)[^<]*(</strong>)',
        rf'\g<1>{now_utc}\g<2>', html, flags=re.DOTALL
    )

    # ── Oil prices ──
    html = re.sub(r'(<div class="oil-price-main"[^>]*>)[^<]*(</div>)',
                  rf'\g<1>{oil["brent"]}\g<2>', html)
    html = re.sub(r'(▲[^<]*since Feb 28, 2026)',
                  f'▲ {oil["brent_change"]}', html)
    html = re.sub(
        r'(id="oil-brent">)[^<]*(</div>)',
        rf'\g<1>{oil["brent"]}\g<2>', html, count=1
    )
    html = re.sub(
        r'(id="oil-wti">)[^<]*(</div>)',
        rf'\g<1>{oil["wti"]}\g<2>', html, count=1
    )
    html = re.sub(
        r'(id="oil-brent-change">)[^<]*(</div>)',
        rf'\g<1>{oil["brent_change"]}\g<2>', html, count=1
    )

    # ── Ticker ──
    ticker_content = build_ticker(news)
    html = re.sub(
        r'<!-- TICKER_START --><div class="ticker-inner">.*?</div><!-- TICKER_END -->',
        f'<!-- TICKER_START --><div class="ticker-inner">\n    {ticker_content}\n  </div><!-- TICKER_END -->',
        html, flags=re.DOTALL
    )

    # ── Events feed ──
    events_html = build_events_html(news)
    html = re.sub(
        r'(<!-- EVENTS_FEED_START -->).*?(<!-- EVENTS_FEED_END -->)',
        rf'\g<1>\n{events_html}\n    \g<2>',
        html, flags=re.DOTALL
    )

    # ── Strikes ──
    if wiki['strikes_total'] != '—':
        html = re.sub(r'(id="hero-strikes">)[^<]*(</div>)',
                      rf'\g<1>{wiki["strikes_total"]}\g<2>', html, count=1)

    if wiki['missile_waves'] != '—':
        html = re.sub(r'(id="stat-waves">)[^<]*(</div>)',
                      rf'\g<1>{wiki["missile_waves"]}\g<2>', html, count=1)
    if wiki['drones_total'] != '—':
        html = re.sub(r'(id="stat-drones">)[^<]*(</div>)',
                      rf'\g<1>{wiki["drones_total"]}\g<2>', html, count=1)

    # ── Displaced ──
    if wiki['displaced'] != '—':
        html = re.sub(
            r'(id="hero-displaced">)[^<]*(</div>)',
            rf'\g<1>{wiki["displaced"]}\g<2>', html, count=1
        )

    # ── Casualties ──
    if wiki['casualties_iran_official'] != '—':
        html = re.sub(
            r'(id="cas1"[^>]*data-target=")[^"]*(">[^<]*</div>)',
            rf'\g<1>{wiki["casualties_iran_official"]}\g<2>',
            html, count=1
        )

    if wiki['casualties_injured'] != '—':
        html = re.sub(
            r'(id="cas1-inj">)[^<]*(</span>)',
            rf'\g<1>{wiki["casualties_injured"]}\g<2>', html, count=1
        )

    # ── Nuclear ──
    if wiki['nuclear_natanz'] != 'Unknown':
        html = re.sub(
            r'(Natanz Enrichment Facility.*?<div class="fac-status)[^>]*(>)[^<]*(</div>)',
            rf'\g<1> fs-struck\g<2>{wiki["nuclear_natanz"]}\g<3>',
            html, flags=re.DOTALL, count=1
        )
    if wiki['nuclear_uranium'] != 'Unknown':
        html = re.sub(
            r'(60%-Enriched Uranium.*?<div class="fac-status)[^>]*(>)[^<]*(</div>)',
            rf'\g<1> fs-unk\g<2>{wiki["nuclear_uranium"]}\g<3>',
            html, flags=re.DOTALL, count=1
        )
    if wiki['nuclear_iaea'] != 'Unknown':
        html = re.sub(
            r'(IAEA Verification.*?<div class="fac-status)[^>]*(>)[^<]*(</div>)',
            rf'\g<1> fs-unk\g<2>{wiki["nuclear_iaea"]}\g<3>',
            html, flags=re.DOTALL, count=1
        )

    # ── Auto-update note in footer ──
    auto_disclaimer = f'⚡ Data auto-updated {now_utc} · Scraped from Wikipedia, Al Jazeera, Reuters, BBC &amp; oilpriceapi.com · Figures are approximate and unconfirmed · Always verify with primary sources'
    html = re.sub(
        r'⚡ Data auto-updated[^<]*',
        auto_disclaimer,
        html, count=1
    )

    # ── Cache-bust CSS on every deploy ──
    import time
    bust = str(int(time.time()))
    html = re.sub(r'styles\.css\?v=[^"]*', f'styles.css?v={bust}', html)

    return html


# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────

def main():
    print(f"\n{'='*50}")
    print(f"WarWatch data fetch — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"{'='*50}\n")

    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    cache = load_cache()
    seen_urls = set(cache.keys())  # only block exact URL duplicates within this run

    oil  = fetch_oil_prices()
    fx   = fetch_exchange_rates()
    wiki = fetch_wikipedia()

    # Fetch new headlines — pass seen_urls so fetchers skip already-cached URLs
    newsapi_items = fetch_newsapi(seen_urls)
    rss_items     = fetch_rss_news(seen_urls)

    # Merge new items into cache
    for item in newsapi_items + rss_items:
        if item.get('link'):
            cache[item['link']] = item

    # Build full headline list from cache, deduplicate by title similarity
    all_items = sorted(cache.values(), key=lambda x: x.get('pub_iso', ''), reverse=True)
    seen_titles, news = [], []
    for item in all_items:
        title_words = set(item['title'].lower().split())
        is_dup = any(
            len(title_words & set(s['title'].lower().split())) > 5
            for s in seen_titles
        )
        if not is_dup and item['title']:
            news.append(item)
            seen_titles.append(item)

    print(f"\n  Total unique headlines: {len(news)}")

    print("\nInjecting data into HTML...")
    updated_html = inject_data(html, oil, wiki, news, fx)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(updated_html)
    print("  ✓ index.html updated")

    save_cache(cache)
    print("  ✓ headlines_cache.json updated")

    # GitHub Actions commits and pushes the updated file automatically
    # via the workflow's git commit step — no deploy call needed here.
    print("\n✓ Done! GitHub Actions will commit and deploy.\n")


if __name__ == '__main__':
    main()
