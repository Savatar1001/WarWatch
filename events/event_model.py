from dataclasses import dataclass
from typing import List, Dict, Any
from datetime import datetime, timezone
import uuid


@dataclass
class Event:
    id: str
    type: str                        # e.g. strike, protest, explosion
    location: str
    timestamp_first_seen: datetime
    sources: List[str]               # list of article URLs or headline identifiers
    status: str                      # New | Developing | Stable


# ── Keyword → event type mapping (priority order — more specific first) ──
TYPE_KEYWORDS = {
    'nuclear':   ['nuclear', 'iaea', 'reactor', 'uranium', 'enrichment', 'khondab', 'natanz', 'fordow'],
    'houthi':    ['houthi'],
    'invasion':  ['invasion', 'invade', 'ground troops', 'marines', 'troops deploy', 'ground operation'],
    'strike':    ['airstrike', 'air strike', 'missile', 'drone', 'bombed', 'bombing', 'struck', 'attack', 'attacked', 'strike'],
    'diplomacy': ['ceasefire', 'talks', 'deal', 'diplomat', 'negotiat', 'peace', 'sanction', 'warning', 'ultimatum'],
    'economic':  ['oil', 'barrel', 'hormuz', 'shipping', 'tanker', 'energy', 'supply', 'price'],
    'casualty':  ['killed', 'death toll', 'casualties', 'civilian toll', 'dead', 'wounded'],
    'protest':   ['protest', 'demonstrat', 'uprising', 'rally'],
}

TYPE_LABELS = {
    'strike':    'Strike / Attack',
    'invasion':  'Ground Invasion Threat',
    'nuclear':   'Nuclear / IAEA',
    'diplomacy': 'Diplomacy / Talks',
    'economic':  'Economic / Energy',
    'houthi':    'Houthi Activity',
    'casualty':  'Casualties',
    'protest':   'Protest',
    'update':    'Situation Update',
}

# ── Raw location detection (specific → general) ──
LOCATIONS = [
    'Khondab', 'Natanz', 'Fordow', 'Kharg', 'Lamerd', 'Bandar Abbas', 'Tehran',
    'Beirut', 'Baghdad', 'West Bank', 'Gaza',
    'Red Sea', 'Hormuz', 'Strait of Hormuz',
    'Kuwait', 'Lebanon', 'Yemen', 'Iraq', 'Syria', 'Saudi Arabia', 'UAE',
    'Israel', 'Iran',
    'Gulf', 'Middle East',
]

# ── Normalize raw location → broader region for grouping ──
LOCATION_REGION = {
    # Iranian cities/sites → Iran
    'Khondab': 'Iran', 'Natanz': 'Iran', 'Fordow': 'Iran',
    'Kharg': 'Iran', 'Lamerd': 'Iran', 'Bandar Abbas': 'Iran', 'Tehran': 'Iran',
    # Gulf states → Gulf
    'Kuwait': 'Gulf', 'UAE': 'Gulf', 'Saudi Arabia': 'Gulf',
    'Hormuz': 'Gulf', 'Strait of Hormuz': 'Gulf', 'Red Sea': 'Gulf',
    # Levant/Iraq → Middle East
    'Beirut': 'Middle East', 'Lebanon': 'Middle East',
    'Baghdad': 'Middle East', 'Iraq': 'Middle East',
    'Syria': 'Middle East', 'West Bank': 'Middle East', 'Gaza': 'Middle East',
    'Gulf': 'Gulf',
    # Keep distinct
    'Yemen': 'Yemen',
    'Israel': 'Israel',
    'Iran': 'Iran',
    'Middle East': 'Middle East',
}


def _infer_type(title: str) -> str:
    t = title.lower()
    for event_type, keywords in TYPE_KEYWORDS.items():
        for kw in keywords:
            if kw in t:
                return event_type
    return 'update'


def _infer_location(title: str) -> str:
    t = title.lower()
    for loc in LOCATIONS:
        if loc.lower() in t:
            return loc
    return 'Middle East'


def _normalize_location(raw: str) -> str:
    return LOCATION_REGION.get(raw, 'Middle East')


def _parse_date(pub: str) -> datetime:
    for fmt in ('%a, %d %b %Y %H:%M:%S %z', '%a, %d %b %Y %H:%M:%S GMT', '%Y-%m-%d'):
        try:
            dt = datetime.strptime(pub.strip(), fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            continue
    return datetime(2000, 1, 1, tzinfo=timezone.utc)


def group_headlines_into_events(headlines: Dict[str, Any]) -> List[Event]:
    """
    Group headlines into Event objects by inferred type + normalized region.
    Pass 1: bucket by (type, normalized_location).
    Pass 2: merge same-type buckets that share strong title keywords.
    Bias toward merging — prefer fewer richer events.
    Status: New = 1 source, Developing = 2-3, Stable = 4+
    """
    # ── Pass 1: bucket by (type, region) ──
    buckets: Dict[str, List] = {}
    for url, item in headlines.items():
        title = item.get('title', '')
        raw_loc = _infer_location(title)
        region = _normalize_location(raw_loc)
        key = f"{_infer_type(title)}|{region}"
        buckets.setdefault(key, []).append({
            'url': url,
            'title': title,
            'pub': item.get('pub', ''),
            'source': item.get('source', ''),
        })

    # ── Pass 2: merge same-type buckets sharing strong keywords ──
    MERGE_KEYWORDS = {
        'economic':  ['oil', 'hormuz', 'energy', 'barrel', 'price'],
        'strike':    ['strike', 'attack', 'missile', 'airstrike'],
        'diplomacy': ['talks', 'deal', 'ceasefire', 'negotiat'],
        'casualty':  ['killed', 'dead', 'casualties'],
        'update':    [],  # merge all updates into one per region
    }

    def _shared_keywords(items_a, items_b, keywords):
        if not keywords:
            return True
        titles_a = ' '.join(i['title'].lower() for i in items_a)
        titles_b = ' '.join(i['title'].lower() for i in items_b)
        return any(kw in titles_a and kw in titles_b for kw in keywords)

    merged: Dict[str, List] = {}
    for key, items in buckets.items():
        event_type = key.split('|')[0]
        placed = False
        for mkey in list(merged.keys()):
            mtype = mkey.split('|')[0]
            if mtype != event_type:
                continue
            kws = MERGE_KEYWORDS.get(event_type, None)
            if kws is None:
                continue
            if _shared_keywords(merged[mkey], items, kws):
                merged[mkey].extend(items)
                placed = True
                break
        if not placed:
            merged[key] = list(items)

    # ── Build Event objects ──
    events = []
    for key, items in merged.items():
        event_type, location = key.split('|', 1)
        sorted_items = sorted(items, key=lambda x: _parse_date(x['pub']))
        earliest = _parse_date(sorted_items[0]['pub'])
        n = len(items)
        status = 'New' if n == 1 else ('Developing' if n <= 3 else 'Stable')

        events.append(Event(
            id=str(uuid.uuid4())[:8],
            type=event_type,
            location=location,
            timestamp_first_seen=earliest,
            sources=[i['url'] for i in sorted_items],
            status=status,
        ))

    events.sort(key=lambda e: e.timestamp_first_seen, reverse=True)
    return events, merged
