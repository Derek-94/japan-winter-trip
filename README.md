# 일본 연말연시 여행 · 日本の年末年始旅行

2026-12-28 ~ 2027-01-05 (8박 9일) 일본 연말연시 여행의 **코스 후보**를 모바일에서 보기 좋게 정리한 정적 웹사이트입니다. 한국어/日本語 전환을 지원합니다.

## 🔗 사이트 주소

- 홈 (코스 후보 목록): https://derek-94.github.io/japan-winter-trip/
- 코스 1 · 기타큐슈~오카야마~오사카: https://derek-94.github.io/japan-winter-trip/course1.html
- 코스 2: 준비 중

## 구조

```
index.html          홈 — 코스 후보 카드 (1코스: 상세 페이지 링크, 2코스: 준비 중)
course1.html        코스 1 상세 — 개요·숙박표, 광역 지도, 날짜별 일정, 기차 가이드, 여행지별 안내(사진·세부 지도), 주의사항
assets/css/style.css
assets/js/data.js    모든 콘텐츠와 번역 (COURSES, PLACES, TRANSLATIONS)
assets/js/main.js    렌더링, 언어 전환, 지도, 갤러리·라이트박스
assets/js/credits.js 사진 출처 (Wikimedia Commons 메타데이터에서 생성)
assets/images/       WebP 사진 (1600px + 720px 썸네일)
```

### 코스 2 추가하는 법

1. `assets/js/data.js`의 `course2`에 코스 1과 같은 형식으로 내용을 채우고 `status: "ready"`로 변경
2. `course1.html`을 복사해 `course2.html`로 만들고 `<body data-page="course2">`로 변경 (제목·OG 태그도 수정)
3. 홈 카드가 자동으로 상세 페이지 링크로 바뀝니다

## 실행

빌드 과정이 없습니다. 폴더를 아무 정적 서버로 열면 됩니다.

```bash
python3 -m http.server 8000
```

GitHub Pages는 `main` 브랜치 루트에서 자동 배포됩니다.

## 기능

- 한국어/日本語 토글 (`localStorage` 저장, `html lang` 전환, 스크롤 위치 유지)
- Leaflet + OpenStreetMap 지도: 광역 동선(교통수단별 선, 숙박/환승/공항 구분, 오카야마 = 환승역) + 지역별 세부 지도 5개 (화면 근처에서 지연 로딩)
- 날짜별 타임라인 카드 (이동·관광·휴식, 숙박지), 기차 4구간 가이드 (JR 패스 미사용)
- 지역별 사진: 대표 1장 + ‘사진 더 보기’ 펼치기, 라이트박스 (ESC·방향키·스와이프)
- `확정` / `방문 후보` / `확인 필요` 표시로 미확정 정보를 구분
- 지도·사진 로드 실패 시 대체 표시, 텍스트 경로와 Google 지도 링크는 항상 제공

## 추가 확인이 필요한 것

- 항공편 시각 (12/28 저녁편 가정)
- 신칸센 열차편·예약 개시일·운임, 연말연시 노조미 전석 지정 여부 — 사이트에 금액은 적지 않았습니다
- 마린라이너 운임·지정석 요금, IC카드 이용 조건
- 소요 시간은 참고치 (고쿠라→오카야마 약 1시간 40분 안팎 등)
- 고쿠라성, 리쓰린 공원, 하치만야마 로프웨이, 식당·우동집의 연말연시 영업
- 기타큐슈공항 버스 막차, 간몬 연락선·인도터널 운영

## 외부 라이브러리

- [Leaflet 1.9.4](https://leafletjs.com/) (unpkg CDN), 지도 타일 © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Google Fonts: Noto Sans/Serif KR·JP

## 사진 출처

모든 사진은 Wikimedia Commons에서 가져왔고 크기만 줄였습니다. 홈 히어로는 기요미즈데라 사진(Martin Falbisoner, CC BY-SA 4.0)을 사용합니다.

| 지역 | 장소 | 작가 | 라이선스 | 원본 |
|---|---|---|---|---|
| 기타큐슈 | 모지코역 | ゴーヤーズ | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Mojiko_Station_at_night_(April_2019,_after_renovation).jpg) |
| 기타큐슈 | 고쿠라성 | Stjepko Krehula | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Kokura_Castle_2024-09-04.jpg) |
| 기타큐슈 | 고쿠라성 정원 | そらみみ (Soramimi) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Shoin_in_Garden_of_Kokura_Castle.JPG) |
| 기타큐슈 | 탄가시장 | Thomas Au | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Commons](https://commons.wikimedia.org/wiki/File:Tanga_Market_Kokura,_Japan_2017-11-26_(27550010079).jpg) |
| 기타큐슈 | 모지코 레트로 | 663highland | [CC BY 2.5](https://creativecommons.org/licenses/by/2.5) | [Commons](https://commons.wikimedia.org/wiki/File:140721_Mojiko_Retro_Kitakyushu_Japan01s3.jpg) |
| 기타큐슈 | 간몬해협 | Ka23 13 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:KanmonStraits_20241220_153314.jpg) |
| 기타큐슈 | 아카마 신궁 | そらみみ (Soramimi) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Ryuguden_Hall_of_Akama_Shrine.JPG) |
| 다카마쓰 | 세토대교 | Kanchi1979 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:JP-Kagawa-Great-Seto-Bridge-Minami_Bisan-Seto-Bridge.jpg) |
| 다카마쓰 | 기쿠게쓰테이 | ブルーノ・プラス | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Ritsurin_garden_kikugetsutei.jpg) |
| 다카마쓰 | 리쓰린 공원 | Sei F | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | [Commons](https://commons.wikimedia.org/wiki/File:Ritsurin_Garden,_Kagawa_Prefecture;_November_2019_(07).jpg) |
| 다카마쓰 | 쾌속 마린라이너 | MaedaAkihiko | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Series223-5000-5007_Marine-liner-8.jpg) |
| 다카마쓰 | 선포트 다카마쓰 | 663highland | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:070426_Sunport-Takamatsu_Takamatsu_Kagawa_pref_Japan01s.jpg) |
| 다카마쓰 | 사누키 우동 | sekido | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Commons](https://commons.wikimedia.org/wiki/File:Kama-age_sanuki_udon_by_sekido_in_Takamatsu,_Kagawa.jpg) |
| 오사카 | 도톤보리 | Martin Falbisoner | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Dotonbori,_Osaka,_at_night,_November_2016.jpg) |
| 오사카 | 우메다 스카이빌딩 | Martin Falbisoner | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Umeda_Sky_Building,_Osaka,_November_2016_-02.jpg) |
| 오사카 | 덴진바시스지 상점가 | Suikotei | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Tenjinbashi-suji-2018-1.jpg) |
| 오사카 | 오사카성 | Sakai Yayoi | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Commons](https://commons.wikimedia.org/wiki/File:Osaka_Castle_and_Gokurakubashi_Bridge.jpg) |
| 교토 | 기요미즈데라 | Martin Falbisoner | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Kiyomizu-dera,_Kyoto,_November_2016_-01.jpg) |
| 교토 | 산넨자카 | Andrea Schaffer from Sydney, Australia | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Commons](https://commons.wikimedia.org/wiki/File:Sannenzaka_street,_Kyoto_(3811257874).jpg) |
| 교토 | 야사카 신사 서루문 | DXR | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Nishiromon_Gate,_Yasaka_Shrine,_Kyoto,_West_view_20190416_1.jpg) |
| 교토 | 야사카 신사 무전 | Basile Morin | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:White_paper_lanterns_hanging_in_Buden_Yasaka_Shrine_in_Kyoto_Japan.jpg) |
| 교토 | 하나미코지 거리 | HAGAT hOMSZE | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Commons](https://commons.wikimedia.org/wiki/File:JP_%E6%97%A5%E6%9C%AC_Japan_%E4%BA%AC%E9%83%BD_Kyoto_Higashiyama-ku_Gion_%E8%8A%B1%E8%A6%8B%E5%B0%8F%E8%B7%AF%E9%80%9A_Hanamikoji_Dori_10am_morning_June_2026_N13P_16.jpg) |
| 오미하치만 | 하치만보리 | Takashi Hososhima from Tokyo, Japan | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) | [Commons](https://commons.wikimedia.org/wiki/File:Hachimanbori_waterway_(10356972954).jpg) |
| 오미하치만 | 하치만보리 산책로 | 先従隗始 | [CC0](http://creativecommons.org/publicdomain/zero/1.0/deed.en) | [Commons](https://commons.wikimedia.org/wiki/File:Hachimanbori_20220227.jpg) |
| 오미하치만 | 히무레 하치만구 | Asturio Cantabrio | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | [Commons](https://commons.wikimedia.org/wiki/File:Himure-hachimangu_torii_ac_(1).jpg) |
| 오미하치만 | 하치만야마 로프웨이 | Ryosuke Yagi | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | [Commons](https://commons.wikimedia.org/wiki/File:Hachiman%27yama_Ropeway.jpg) |
