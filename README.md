# 일본에서 보내는 겨울, 세 가지 여행 / 日本で過ごす冬、3つの旅

2026.12.28(월) – 2027.01.05(화), 8박 9일 일본 연말연시 여행 후보 3코스(규슈 종단 · 세토내해 · 나고야·중부·호쿠리쿠)를 비교하는 모바일 우선 정적 웹사이트입니다. 한국어/日本語 전환을 지원합니다.

## 열기

- **로컬:** `index.html`을 브라우저에서 바로 열면 됩니다(서버 불필요). 모든 경로는 상대 경로입니다. 코스 페이지 주소는 `kyushu.html`, `setouchi.html`, `hokuriku.html`입니다.
- **로컬 서버(선택):** `python3 -m http.server 8000` 실행 후 http://localhost:8000
- **배포:** 폴더 전체를 GitHub Pages, Netlify, Cloudflare Pages 등 정적 호스팅에 그대로 올리면 됩니다. 빌드 과정은 없습니다.

## 파일 구조

```text
japan-winter-trip/
├── index.html              # 홈: 코스 카드 3개 + 세 코스 비교표 + 연말연시 주의사항
├── kyushu.html             # 코스 ① 규슈 종단 페이지
├── setouchi.html           # 코스 ② 세토내해 페이지
├── hokuriku.html           # 코스 ③ 나고야·중부·호쿠리쿠페이지
├── assets/
│   ├── css/style.css       # 모바일 우선 스타일 (320px ~ 1280px+)
│   ├── js/data.js          # translations(UI 문자열) + courses(코스·일정·지도·사진 데이터)
│   ├── js/credits.js       # 사진 작가·라이선스 (Wikimedia Commons 메타데이터에서 생성)
│   ├── js/main.js          # 렌더링, 언어 전환, 지도, 갤러리, 라이트박스
│   └── images/             # WebP 23장 × 2사이즈 (1600px / 720px)
└── README.md
```

### 콘텐츠 수정

- 세 코스 페이지는 같은 구조이고 `<body data-page="코스id">`만 다릅니다. 내용은 모두 데이터에서 렌더링됩니다.
- 문구는 모두 `assets/js/data.js`에 `{ ko, ja }` 쌍으로 들어 있습니다. UI 문자열은 `TRANSLATIONS`, 코스 내용은 `COURSES`.
- 코스별 `stops[].nights` 합계가 화면의 "숙박 합계 N박"으로 자동 표시됩니다(현재 세 코스 모두 8박).
- 사진 교체: `assets/images/`에 `이름.webp`(1600px)와 `이름-sm.webp`(720px)를 넣고 `COURSES[].photos`의 `key`와 `credits.js`의 항목을 함께 바꿉니다.

## 기능

| 기능 | 구현 |
|---|---|
| 한국어 / 日本語 전환 | 헤더 토글, `localStorage` 저장(차단 시 기본 한국어), `<html lang>` 전환, 전환 시 스크롤 위치·열린 갤러리·지도 상태 유지 |
| 페이지 구성 | 홈(`index.html`)의 카드를 누르면 코스별 페이지(`kyushu.html` / `setouchi.html` / `hokuriku.html`)로 이동. 코스 페이지에는 히어로·지도·이동 순서·날짜별 일정·갤러리·장단점, 이전/다음 코스, 비교표 링크가 있음. 하단 내비: 홈 / 규슈 / 세토내해 / 호쿠리쿠 / 비교 |
| 언어 유지 | 선택한 언어가 `localStorage`에 저장되어 페이지를 옮겨도 유지 |
| 지도 3개 | Leaflet + OpenStreetMap 타일, 번호 마커, 방문 순서 점선(개략 동선), 언어별 팝업, `fitBounds`, 휠 줌 기본 OFF, 터치 기기는 "지도 조작 켜기" 후 한 손가락 드래그 |
| 지도 실패 대비 | Leaflet 로딩 실패 시 안내문 표시, 타일 오류 시 안내 오버레이, 텍스트 이동 순서 + 장소별 Google 지도 링크 + OSM 링크 항상 제공 |
| 사진 갤러리 | 대표 사진 항상 표시, `<details>`로 '사진 더 보기' 접기/펼치기, 모바일 2열 / 600px 이상 3열 |
| 라이트박스 | 이전/다음, 닫기, ESC, ←/→, 스와이프(좌우 이동, 아래로 닫기), 포커스 트랩·복귀, 배경 스크롤 잠금 |
| 이미지 | 대표 이미지 우선 로딩, 나머지 `loading="lazy"`, WebP, `width/height`·`aspect-ratio`로 CLS 방지, 로드 실패 시 대체 표시 |
| 접근성 | 터치 영역 44px 이상, 포커스 스타일, 이미지 `alt`/버튼 `aria-label`, 건너뛰기 링크, 키보드로 모든 기능 사용 가능 |

## 오프라인에서

| 동작함 | 동작하지 않음 |
|---|---|
| 모든 텍스트·일정·비교표·주의사항, 언어 전환, 사진(로컬 파일), 갤러리, 라이트박스, 텍스트 이동 순서 | 지도(Leaflet 스크립트·OSM 타일이 외부 CDN), 웹폰트(Noto는 시스템 폰트로 대체), 외부 링크 |

## 외부 의존성

- **Leaflet 1.9.4** (BSD-2-Clause): `https://unpkg.com/leaflet@1.9.4/`
- **OpenStreetMap 타일** (© OpenStreetMap contributors, ODbL): `https://tile.openstreetmap.org/`. [타일 이용 정책](https://operations.osmfoundation.org/policies/tiles/)에 따라 저작자 표시를 지도에 넣었습니다. 트래픽이 많은 공개 서비스로 운영하려면 별도 타일 제공자 사용을 검토하세요.
- **Google Fonts**: Noto Sans KR/JP, Noto Serif KR/JP (SIL OFL)

API 키, 서버, DB, 빌드 도구는 사용하지 않습니다.

## 사진 출처 및 라이선스

모든 사진은 Wikimedia Commons에서 가져왔고, 리사이즈와 WebP 변환 외에는 수정하지 않았습니다. 사이트 하단의 "사진 출처 및 라이선스"와 라이트박스 캡션에도 같은 내용이 표시됩니다. 일부 사진은 촬영 계절이 여행 시기(겨울)와 다릅니다.

| 파일 | 작가 | 라이선스 | 원본 |
|---|---|---|---|
| `hokuriku-01-shirakawago-snow.webp` | Suicasmo | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Shirakawa-go_20170202-3.jpg) |
| `hokuriku-02-nagoya-sakae.webp` | そらみみ (Soramimi) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:View_of_Sakae_Area_from_glass_roof_of_Oasis_21.JPG) |
| `hokuriku-03-gero-onsen.webp` | Alpsdake | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Hida_River_and_Gero_Onsen_from_Mutsumi_Bridge.jpg) |
| `hokuriku-04-takayama-sanmachi.webp` | Raita Futo from Tokyo, Japan | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Commons](https://commons.wikimedia.org/wiki/File:Hida_Takayama_old_town_streets_(48519369602).jpg) |
| `hokuriku-05-kanazawa-higashichaya.webp` | Raita Futo from Tokyo, Japan | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Commons](https://commons.wikimedia.org/wiki/File:Higashi_Chaya_District_(50154601217).jpg) |
| `hokuriku-06-kenrokuen-yukitsuri.webp` | そらみみ | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Yukitsuri_in_Kenroku_Garden.jpg) |
| `hokuriku-07-shirakawago-village.webp` | Raita Futo from Tokyo, Japan | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Commons](https://commons.wikimedia.org/wiki/File:Winter_in_Shirakawa-go_(51815451686).jpg) |
| `kyushu-01-kagoshima-sakurajima.webp` | そらみみ | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Kagoshima_City_and_Mount_Sakurajima_from_Mount_Shiroyama_3.JPG) |
| `kyushu-02-fukuoka-tenjin.webp` | Chihaya Sta | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons](https://commons.wikimedia.org/wiki/File:FukuokaTenjin_Nishidori_Avenue.jpg) |
| `kyushu-03-hakata-nakasu.webp` | Yoshikazu TAKADA from Tokyo, Japan | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Commons](https://commons.wikimedia.org/wiki/File:Nakasu_Yatai_Stalls_(19979437930).jpg) |
| `kyushu-04-sakurajima-lava.webp` | そらみみ | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Lava_rocks_near_Hakamagoshi_Crossroads.jpg) |
| `kyushu-05-ibusuki-sandbath.webp` | MaedaAkihiko | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Ibusuki-sand-bath_Saraku.jpg) |
| `kyushu-06-kirishima-onsen.webp` | Ray_go | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons](https://commons.wikimedia.org/wiki/File:Kirishima_Maruo_Onsen.jpg) |
| `kyushu-07-kaimondake-sea.webp` | 名古屋太郎 | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons](https://commons.wikimedia.org/wiki/File:Kaimondake_frm_sea.jpg) |
| `kyushu-08-ibusuki-sands.webp` | BirdsEyeLV | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | [Commons](https://commons.wikimedia.org/wiki/File:Ibusuki_hot_sands_-_panoramio.jpg) |
| `setouchi-01-itsukushima-torii.webp` | Jakub Hałun | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Itsukushima-jinja_torii_at_sunset,_Miyajima,_Japan,_20240816_1812_4144.jpg) |
| `setouchi-02-hiroshima-hondori.webp` | そらみみ | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Hiroshima-Hondori_Shopping_Street_at_dusk.jpg) |
| `setouchi-03-miyajima-coast.webp` | Jakub Hałun | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Sunset_on_the_coast_of_Miyajima_island,_20240816_1803_4107.jpg) |
| `setouchi-04-onomichi-senkoji.webp` | そらみみ | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:View_of_Onomichi_Bridge_and_Onomichi_Channel_near_Senkoji_Temple.jpg) |
| `setouchi-05-onomichi-street.webp` | RitikaPahwa4444 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Onomichi_44.jpg) |
| `setouchi-06-shimanami.webp` | Fabimaru | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Shimanami_kaid%C5%8D_to_Tatara_Bridge.jpg) |
| `setouchi-07-kurashiki-bikan.webp` | Suicasmo | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Kurashiki_Bikan_historical_quarter_20190324-3.jpg) |
| `setouchi-08-onomichi-catpath.webp` | そらみみ | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Narrow_Path_of_Cats_in_Onomichi,_Hiroshima_1.jpg) |

CC BY-SA 사진의 리사이즈본은 같은 라이선스(CC BY-SA)로 배포됩니다.

## 참고 / 주의

- 일정은 **선택을 위한 초안**입니다. 항공편·숙소·교통패스·개별 시설 영업·요금은 확정되지 않았습니다.
- 지도 좌표는 주요 도시·지역 중심의 근삿값이며, 선은 실제 철도·도로·페리 경로가 아닌 방문 순서를 나타냅니다.
- 참고: [JNTO 영업시간·휴무](https://faq.japan-travel.jnto.go.jp/en/plan/business-hours-and-holidays/), [japan-guide.com 연말연시](https://www.japan-guide.com/e/e2276.html), [Leaflet Quick Start](https://leafletjs.com/examples/quick-start/)
