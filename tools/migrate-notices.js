// Notice.dc.html의 정적 posts[] 8개를 Firestore notices 컬렉션으로
// 일괄 입력하는 1회성 마이그레이션 스크립트.
//
// 사전 준비
//   1. Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 →
//      "새 비공개 키 생성"으로 JSON 키 파일을 내려받는다.
//   2. 그 파일을 이 스크립트와 같은 폴더에
//      serviceAccountKey.json 이름으로 둔다.
//      (이 파일은 절대 git에 커밋하지 말 것 — .gitignore 확인)
//
// 실행
//   cd C:\claude\filmcommando-web-v1\tools
//   node migrate-notices.js
//
// 실행 후 반드시 할 일
//   - serviceAccountKey.json 파일을 즉시 삭제한다.
//   - Firebase 콘솔의 서비스 계정 페이지에서
//     방금 발급한 키를 폐기(Revoke)한다.
//   - 이 두 가지를 하지 않으면 Firestore 전체에 대한
//     관리자 권한 자격증명이 로컬 디스크에 그대로 남는다.

const admin = require('firebase-admin');
const path = require('path');

const keyPath = path.join(__dirname, 'serviceAccountKey.json');

let serviceAccount;
try {
  serviceAccount = require(keyPath);
} catch (e) {
  console.error('서비스 계정 키를 찾을 수 없습니다: ' + keyPath);
  console.error('위 "사전 준비" 안내를 먼저 진행해 주십시오.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 기존 Notice.dc.html 정적 posts[] 원본 (마이그레이션 전 값)
// date는 원본 "YYYY.MM.DD" 표기를 스키마 명시값인
// "YYYY-MM-DD"로 변환해 저장한다.
const posts = [
  { no: 24, cat: '일정',       title: '2026년 하계 시공 일정 및 휴무 안내',                       date: '2026.07.21' },
  { no: 23, cat: '자재 · 단가', title: '인테리어 필름 자재 단가 조정 안내 (8월 시공분부터 적용)',   date: '2026.07.14' },
  { no: 22, cat: 'A/S',        title: 'A/S 접수 절차 변경 안내 — 전화 접수로 통합',                 date: '2026.06.30' },
  { no: 21, cat: '일정',       title: '장마철 시공 진행 기준 안내 (습도와 접착력)',                 date: '2026.06.18' },
  { no: 20, cat: '자재 · 단가', title: '내열 자재 신규 입고 — 주방 레인지 주변 적용',                date: '2026.05.27' },
  { no: 19, cat: '일정',       title: '5월 연휴 실측 방문 일정 안내',                               date: '2026.04.29' },
  { no: 18, cat: 'A/S',        title: '보증 제외 항목 안내 (칼자국 · 임의 도색)',                   date: '2026.04.10' },
  { no: 17, cat: '일정',       title: '수도권 외 지역 방문실측 운영 기준 변경',                     date: '2026.03.22' },
];

function toIsoDate(dotDate) {
  return dotDate.replace(/\./g, '-');
}

async function migrate() {
  const batch = db.batch();
  for (const p of posts) {
    const ref = db.collection('notices').doc();
    batch.set(ref, {
      no: p.no,
      cat: p.cat,
      title: p.title,
      content: '(내용 없음)',
      date: toIsoDate(p.date),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  console.log('마이그레이션 완료: ' + posts.length + '건 입력됨');
  console.log('이제 serviceAccountKey.json을 삭제하고');
  console.log('Firebase 콘솔에서 해당 키를 폐기해 주십시오.');
}

migrate().catch((e) => {
  console.error('마이그레이션 실패:', e);
  process.exit(1);
});
