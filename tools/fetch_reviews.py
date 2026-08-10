#!/usr/bin/env python3
"""Pobiera opinie z wizytówki Google (Places API New) i zapisuje je do reviews.json.

Uruchomienie lokalne:
    GOOGLE_MAPS_API_KEY=... GOOGLE_PLACE_ID=ChIJ... python tools/fetch_reviews.py --dry-run

Na produkcji odpala się z GitHub Actions (.github/workflows/reviews.yml) raz na dobę.
Codzienne odświeżanie jest wymagane – warunki Google nie pozwalają trzymać treści
opinii dłużej niż 30 dni.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

API_URL = "https://places.googleapis.com/v1/places/{place_id}"
SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = "id,displayName,rating,userRatingCount,googleMapsUri,reviews"
SEARCH_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount"

# paleta awatarów – ta sama, co w statycznych kartach w index.html
AVATAR_COLORS = ["#1A73E8", "#E8710A", "#188038", "#A142F4", "#D93025", "#0F9D6B", "#B26A00", "#7B5CD6"]


def initials(name):
    parts = [p for p in name.replace(".", " ").split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[1][0]).upper()


def fetch_place(place_id, api_key, language="pl"):
    url = API_URL.format(place_id=place_id) + f"?languageCode={language}"
    request = urllib.request.Request(url, headers={
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    })
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def find_places(query, api_key, language="pl"):
    """Wyszukuje wizytówkę po nazwie i zwraca kandydatów wraz z identyfikatorami."""
    body = json.dumps({"textQuery": query, "languageCode": language}).encode("utf-8")
    request = urllib.request.Request(SEARCH_URL, data=body, headers={
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    })
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8")).get("places", [])


def build_payload(place):
    reviews = []
    for index, review in enumerate(place.get("reviews", [])):
        author = review.get("authorAttribution", {}) or {}
        name = author.get("displayName", "").strip() or "Klient Google"
        text = (review.get("originalText") or review.get("text") or {}).get("text", "").strip()
        if not text:
            continue
        reviews.append({
            "author": name,
            "initials": initials(name),
            "color": AVATAR_COLORS[index % len(AVATAR_COLORS)],
            "photo": author.get("photoUri", ""),
            "profileUrl": author.get("uri", ""),
            "rating": review.get("rating", 5),
            "relativeTime": review.get("relativePublishTimeDescription", ""),
            "publishTime": review.get("publishTime", ""),
            "text": text,
        })

    return {
        "name": (place.get("displayName") or {}).get("text", ""),
        "rating": place.get("rating"),
        "ratingCount": place.get("userRatingCount", 0),
        "profileUrl": place.get("googleMapsUri", ""),
        "reviews": reviews,
    }


def main():
    parser = argparse.ArgumentParser(description="Pobiera opinie Google do reviews.json")
    parser.add_argument("--place-id", default=os.environ.get("GOOGLE_PLACE_ID", ""))
    parser.add_argument("--find", metavar="NAZWA", help="wyszukaj identyfikator wizytówki po nazwie")
    parser.add_argument("--out", default="reviews.json")
    parser.add_argument("--language", default="pl")
    parser.add_argument("--dry-run", action="store_true", help="wypisz wynik zamiast zapisywać plik")
    args = parser.parse_args()

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    if not api_key:
        # brak klucza nie jest błędem – strona po prostu zostaje przy treści z index.html
        print("Brak GOOGLE_MAPS_API_KEY – pomijam pobieranie opinii.")
        return

    if args.find:
        try:
            places = find_places(args.find, api_key, args.language)
        except urllib.error.HTTPError as error:
            sys.exit(f"Google zwróciło błąd {error.code}: {error.read().decode('utf-8', 'replace')}")
        if not places:
            sys.exit("Nic nie znaleziono – spróbuj dopisać miejscowość do nazwy.")
        for place in places:
            name = (place.get("displayName") or {}).get("text", "")
            print(f"{place.get('id', '')}\n  {name} – {place.get('formattedAddress', '')}"
                  f"\n  ocena: {place.get('rating', '-')} ({place.get('userRatingCount', 0)} opinii)\n")
        return

    if not args.place_id:
        sys.exit("Brak identyfikatora miejsca – podaj --place-id albo GOOGLE_PLACE_ID.")

    try:
        place = fetch_place(args.place_id, api_key, args.language)
    except urllib.error.HTTPError as error:
        sys.exit(f"Google zwróciło błąd {error.code}: {error.read().decode('utf-8', 'replace')}")
    except urllib.error.URLError as error:
        sys.exit(f"Nie udało się połączyć z Google: {error.reason}")

    payload = build_payload(place)

    if not payload["reviews"]:
        # pusty wynik nie nadpisuje działającego pliku – strona pokaże ostatnie dobre dane
        print("Wizytówka nie zwróciła żadnych opinii – plik pozostaje bez zmian.")
        return

    output = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"

    if args.dry_run:
        print(output)
        return

    with open(args.out, "w", encoding="utf-8") as handle:
        handle.write(output)
    print(f"Zapisano {len(payload['reviews'])} opinii do {args.out}")


if __name__ == "__main__":
    main()
