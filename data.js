// Key of Rich in Bali 일정 데이터
// tag: normal(노랑) | food(핑크) | shop(보라) | sight(초록) | theme(인디고)  (워시테이프 색상에 사용)
// ※ theme(indigo) 태그: 사용 활성화됨. 특별 이벤트/체험성 일정에 자유롭게 사용 가능하며,
//   라벨·색상 매핑(app.js)과 CSS(style.css .tag-theme)도 정식 지원 상태로 유지한다.

// ---------------- 준비물 체크리스트: 카테고리 (단일 소스, B1) ----------------
// index.html의 추가폼 select와 app.js의 CHECKLIST_VALID_CATS가 모두 여기서 파생됨.
// 카테고리를 추가/변경/삭제하려면 이 배열만 수정하면 됨(다른 파일은 손댈 필요 없음).
const CHECKLIST_CATEGORIES = ["여권서류", "의류", "전자기기", "세안미용", "기타"];

// ---------------- 공항→시내 교통정보 (단일 소스, B2) ----------------
// index.html의 transitCard 하드코딩 대신 여기서 렌더링 데이터를 관리.
// 다른 여행 데이터에서도 이 구조 그대로 복사해서 재사용 가능(공항/도심역 이름·이동수단만 교체).
const TRANSIT_INFO = {
  title: "✈️ 덴파사르 공항 → 시내",
  methods: [
    {
      icon: "🚇",
      name: "지하철 (추천)",
      steps: [
        "예: 이동 경로를 순서대로 적어주세요 (환승/소요시간 포함)"
      ],
      durationLabel: "총 소요시간",
      duration: "예: 약 20~25분",
      fareLabel: "요금",
      fare: "예: 260엔",
      payment: ["현금", "IC 교통카드", "Visa 등 컨택리스 카드"],
    },
    {
      icon: "🚌",
      name: "버스",
      steps: [
        "예: 이동 경로를 순서대로 적어주세요 (환승/소요시간 포함)"
      ],
      durationLabel: "소요시간",
      duration: "예: 약 15~20분 (교통 상황에 따라 변동)",
      fareLabel: "요금",
      fare: "예: 400엔",
      payment: ["현금", "IC 교통카드", "Visa 등 컨택리스 카드"],
    },
  ],
  recommend: [
    "예: 빠르고 시간 정확: 🚇 지하철",
    "예: 짐이 많거나 환승이 번거롭다면: 🚌 버스",
  ],
};

// ---------------- 지도 좌표 (확정본) ----------------
// mapQuery 텍스트를 키로 사용. 여기 등록된 곳은 기기/캐시와 무관하게 항상 이 좌표를 그대로 써서
// 모든 기기에서 동일하게 보인다 - 공유 시 각자 수동으로 다시 찾을 필요 없음.
// 일정 수정으로 mapQuery 문구 자체가 바뀌면, 그 새 문구는 여기 없으니 앱이 자동으로 다시 지오코딩을 시도한다.
// 다른 여행 데이터에서도 이 구조(GEO_COORDS/GEO_SEARCH_QUERY) 그대로 복사해서 재사용 가능.
// 신규 여행이라 확정 좌표가 아직 없음 — 장소를 추가하면서 하나씩 채워나간다.
const GEO_COORDS = {};

// 위 GEO_COORDS에 없는 곳(대부분 특정 매장·지점) 중, 한국어 mapQuery로는 OSM 검색이 잘 안 되는
// 곳들을 위한 영문/현지어 검색어. 자동 지오코딩 시도할 때 이 문구를 우선 사용한다.
// (그래도 실패하면 지도에서 빼지 않고 "위치 확인 필요" 목록에 남겨 수동 확정을 기다린다)
const GEO_SEARCH_QUERY = {};

const TRIP = {
  title: "Key of Rich in Bali",
  hotel: {
    name: "",
    checkin: "",
    checkout: ""
  },
  // 개인 식별 정보(나의 이름): 하드코딩 대신 데이터 레이어(TRIP 객체)에서 관리(T03).
  // classifyExpense/myShare(app.js)에서 splitWith 판별에 사용.
  meName: "나",
  // 일차 목록 — index.html의 DAY 탭(#dayTabs)·지도 필터(#mapDayFilter)와 app.js의
  // mapMarkerLayers를 이 배열 기준으로 동적 생성하는 단일 소스(B3). 신규 여행이라 아직
  // 비어 있음 — 일정을 짜면서 { day: 1, date: "..." } 형태로 하나씩 채워나간다.
  days: [],
  flights: []
};

// 일정 아이템 (날짜별 타임라인에 표시될 장소/이벤트). 채워나가면서 추가.
// 필드: id(문자열, 예: "d1-1") / day(숫자, 일차) / time("HH:MM") / tag(상단 enum 참고: normal/food/shop/sight/theme) /
//   title(장소·이벤트명) / desc(한줄 설명, 빈 문자열 가능) / mapQuery(지도 검색어) / remark(비고, 빈 문자열 가능)
// 예: { id: "d1-1", day: 1, time: "09:00", tag: "normal", title: "호텔 체크인", desc: "", mapQuery: "○○호텔", remark: "" }
const ITEMS = [];

// 체크리스트 탭 "참고정보" 섹션에 노출되는 항목 (탭하면 고정 카드 팝업이 열림)
const REFERENCE_ITEMS = [
  { id: "ref-japanese-phrases", title: "🗣️ 자주 쓰는 일본어" },
  { id: "ref-shopping-list", title: "🛒 쇼핑리스트" },
  { id: "ref-food-list", title: "🍜 꼭 먹어야 할 음식" },
  { id: "ref-shopping-stores", title: "🛍️ 쇼핑 추천 매장" },
  { id: "ref-airport-station", title: "✈️ 덴파사르 공항 ↔ 시내 이동" },
];

// "자주쓰는 일본어" 카드에 노출되는 표현 목록 (category별로 묶어 표시)
// 필드: category(그룹명, 이모지 포함) / ko(한국어) / ja(일본어) / pron(한글 발음)
// 예: { category: "🙋 인사·기본", ko: "감사합니다", ja: "ありがとうございます", pron: "아리가토 고자이마스" }
const JAPANESE_PHRASES = [];

// ---------------- 참고정보: 쇼핑 추천 매장 (표) ----------------
// 필드명은 다른 여행에서도 그대로 재사용 가능하도록 통일함: name/area/hours/recommend/mapQuery
// (image 필드는 2026-07-26 결정으로 제거됨 — 매장 사진은 소싱하지 않는다. changelog 참고)
const SHOPPING_STORES = [];

// ---------------- 참고정보: 쇼핑리스트 / 꼭 먹어야 할 음식 공통 데이터 구조 ----------------
// group: 그룹 제목(이모지 포함) / items: { title, desc(한줄 설명), mapQuery } 배열
// 이 구조는 쇼핑리스트·음식 카드가 공유하며, 다른 여행 데이터로도 그대로 재사용 가능함
const SHOPPING_LIST = [];

// ---------------- 가계부 (나만 보기 전용, Bella Travel 경유 진입 시에만 노출) ----------------
// 이 배열은 "최초 시드값"일 뿐이다. 앱 안에서 가계부 카드의 입력폼으로 한 번이라도 추가/수정/삭제하거나
// CSV를 가져오면, 이후로는 IndexedDB에 저장된 내용이 우선 사용되고 이 배열은 무시된다
// (app.js의 loadExpenses/currentExpenses 참고). 평소에는 이 배열을 채울 필요가 없다 — 앱 안에서 입력한다.
// splitWith: 나눠 낼 사람(들). "내 이름(TRIP.meName 또는 설정의 내 이름)이 들어 있는 항목만 내 몫"으로 계산함 (app.js 참고)
//   - 내 이름 포함 + 2명 이상 → 공동경비 (금액을 인원수로 나눈 값이 내 몫)
//   - 내 이름 포함 + 1명(나) → 개인경비 (전액 내 몫)
//   - 내 이름이 없으면(타인 단독, 나 없이 나눈 공동 포함) → 내 합계에서 제외, "타인 경비" 그룹에 표시
// (T03: 기존 별도 ME_NAME 상수는 TRIP.meName으로 이동)

// 통화 기본값: 대부분의 지출이 KRW라 매 항목마다 currency/krwRate를 반복 입력하지 않도록
// 기본값을 상수화하고 krw(...)로 감싼다. KRW가 아닌 항목만 currency/krwRate를 직접 명시한다.
const DEFAULT_CURRENCY = "KRW";
const DEFAULT_KRW_RATE = 1;
const krw = (e) => ({ currency: DEFAULT_CURRENCY, krwRate: DEFAULT_KRW_RATE, ...e });

// 통화 기호 (단일 소스, B4) — 위 krw 기본값과는 별도 계층.
// 새 통화를 지원해야 하면 이 표에 한 줄만 추가하면 되고(app.js 수정 불필요),
// 등록되지 않은 통화는 app.js formatMoney()가 기호 없이 "금액 통화코드"로 자동 표시한다(예: "100 THB").
const CURRENCY_SYMBOLS = {
  KRW: "₩", USD: "$", JPY: "¥", EUR: "€", GBP: "£", CNY: "¥", THB: "฿", TWD: "NT$",
  HKD: "HK$", SGD: "S$", AUD: "A$", CAD: "C$", NZD: "NZ$", PHP: "₱", INR: "₹", TRY: "₺", MYR: "RM", MXN: "MX$",
};
// ↑ 여기에 없는 통화(VND, CHF, CZK …)도 가계부에서 자유롭게 쓸 수 있고, "1,000 VND"처럼 코드가 붙어 표시된다.
//   기호로 보이고 싶으면 한 줄만 추가하면 된다. (통화 코드는 앱 입력폼의 "＋ 다른 통화 직접 입력…"으로 추가)

// 이 여행의 현지 통화 기본값 (가계부 입력폼의 기본 통화/환율). scaffold.html 생성 시 채워짐.
// krwRate가 0이면 "미설정" — 입력폼에서 환율을 직접 넣어야 하고, 한 번 입력한 환율은 같은 통화의 다음 입력에 자동으로 따라온다.
const EXPENSE_CURRENCY_DEFAULT = { code: "IDR", krwRate: 0.0752 };

// 가계부 입력폼의 카테고리 추천 목록(자유 입력도 가능). 여행에 맞게 수정.
const EXPENSE_CATEGORIES = ["항공", "숙박", "교통", "식비", "쇼핑", "관광", "기타"];

// 국가별 기능 스위치 (scaffold.html에서 국가 선택에 따라 채워짐). false면 해당 카드/참고정보가 앱에서 숨겨진다.
const TRIP_FEATURES = { visitJapan: false, japanesePhrases: false };

// 여행 지출 항목 (가계부 카드 초기값, 앱 내 입력/CSV 가져오기 시 IndexedDB 값으로 대체됨 — 위 설명 참고)
// 필드: day(문자열, 예: "여행준비" 또는 숫자 일차) / item(항목명) / category(분류) / amount(숫자, 해당 통화 금액) /
//   currency/krwRate(KRW면 krw({...})로 감싸 생략 가능, 그 외 통화만 직접 명시) / splitWith(나눠 낼 사람 이름 배열)
// 예: krw({ day: "여행준비", item: "항공권", category: "항공", amount: 300000, splitWith: ["나"] })
const EXPENSES = [];

// ---------------- 참고정보: 꼭 먹어야 할 음식 (간식은 구매처별로 분류) ----------------
const FOOD_LIST = [];
