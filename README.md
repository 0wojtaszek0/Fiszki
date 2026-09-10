# Fiszki — aplikacja cyfrowa i do druku

To repozytorium zawiera dwie powiązane aplikacje webowe przygotowane do pracy z plikami CSV z listą słówek:

- cyfrową aplikację do nauki fiszek,
- aplikację do przygotowania wydruku na papierze A4.

## Jak uruchomić

Uruchom lokalny serwer z katalogu projektu:

```bash
cd /Users/wojciechofiara/Desktop/Studia/Fiszki
python3 -m http.server 8000
```

Następnie otwórz w przeglądarce:

- http://localhost:8000/
- http://localhost:8000/digital-app/index.html
- http://localhost:8000/print-app/index.html

## Geometria układu A4 i fiszek

### Strona A4 w orientacji poziomej
- szerokość: 297 mm
- wysokość: 210 mm

### Kolumny na jednej stronie
Cała szerokość strony ma zostać podzielona idealnie na 3 równe kolumny:

```text
297 mm / 3 = 99 mm
```

Każda kolumna ma być równą szerokości 99 mm.

### Rozmiar jednej fiszki
Zakładana końcowa fiszka ma mieć format wizytówki:

- 90 mm szerokości
- 50 mm wysokości

Ponieważ każda fiszka ma być wydrukowana jako dwa pola: przód i tył, układ pojedynczej karty do cięcia i złożenia przyjmuje rozmiar:

- szerokość: 90 mm
- wysokość: 100 mm (połowa przód 50 mm + połowa tył 50 mm)

Wewnątrz kolumny 99 mm mamy więc miejsce na kartę o szerokości 90 mm, zostawiając dwa marginesy po 4,5 mm:

```text
99 mm - 90 mm = 9 mm
9 mm / 2 = 4,5 mm
```

Dzięki temu układ jest dokładny i proporcjonalny, a wymiary odpowiadają założeniom technicznym.

### Odpowiednia orientacja po złożeniu
Strona przodu i tylna strona fiszki są ustawione względem siebie tak, aby po złożeniu kartki:

- przód pokazywał słowo w języku obcym,
- tył pokazywał tłumaczenie,
- obie strony były prawidłowo zorientowane,
- nie trzeba było obracać jednej z części do góry nogami.

W praktyce zastosowano układ z wyróżnioną linią zgięcia i oddzielonymi panelami przód/tył. Dla druku dwustronnego (duplex) tył musi zostać ustawiony w odwrotnej orientacji, aby po złożeniu uzyskać prawidłowy odczyt.

## Format CSV

Plik CSV powinien zawierać kolumny:

- słowo/wyrażenie w języku obcym,
- tłumaczenie w języku polskim.

Przykład:

```csv
Słowo angielskie,Tłumaczenie
apple,jabłko
book,książka
cat,kot
```

Aplikacja obsługuje UTF-8 i znaki diakrytyczne, w tym polskie litery.

## Funkcjonalność

### 1. Aplikacja do tworzenia fiszek cyfrowych

- wczytanie pliku CSV,
- automatyczne odczytanie wszystkich rekordów,
- osobna fiszka dla każdego wpisu,
- przeglądanie jedna po drugiej,
- przewracanie fiszki oraz nawigacja przyciskami / klawiaturą,
- obsługa polskich znaków UTF-8.

### 2. Aplikacja do przygotowywania fiszek do druku

- format strony A4 w orientacji poziomej,
- 3 równe kolumny,
- dokładne wymiary fiszek i odległości,
- automatyczne rozdzielenie fiszek na kolejne strony A4,
- wersja gotowa do wydruku PDF z poziomu przeglądarki.

## Dodatkowe pola w przyszłości

Struktura danych jest przygotowana tak, aby łatwo dodać pola typu:

- przykładowe zdanie,
- wymowa,
- kategoria,
- poziom trudności.

Wystarczy rozbudować parser CSV i obiekt karty o kolejne pola, a układy cyfrowe i drukarskie zachowają kompatybilność.

