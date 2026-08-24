// Resources.dc.html의 정적 files[] 6개를 Firestore resources 컬렉션으로
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
//   node migrate-resources.js
//
// 실행 후 반드시 할 일
//   - serviceAccountKey.json 파일을 즉시 삭제한다.
//   - Firebase 콘솔의 서비스 계정 페이지에서
//     방금 발급한 키를 폐기(Revoke)한다.
//   - 이 두 가지를 하지 않으면 Firestore 전체에 대한
//     관리자 권한 자격증명이 로컬 디스크에 그대로 남는다.
//
// downloadUrl은 마이그레이션 시점에 빈 값("")으로 입력된다.
// 관리자가 Resources.dc.html의 "자료 등록" UI에서 각 자료의
// GitHub Releases 다운로드 URL을 추후 직접 입력해야 한다.

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
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

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// 기존 Resources.dc.html 정적 files[] 원본 (마이그레이션 전 값)
// meta("PDF · 0.4MB")는 fileSize("0.4MB")와 cat("PDF")으로 분리해 저장한다.
// date는 원본에 없었으므로 마이그레이션 실행일을 사용한다.
const files = [
  { title: "리모델링 사전 점검 체크리스트", cat: "PDF", fileSize: "0.4MB" },
  { title: "견적서 비교표 서식", cat: "XLSX", fileSize: "0.1MB" },
  { title: "관리사무소 공사 신고 서식 예시", cat: "PDF", fileSize: "0.3MB" },
  { title: "5주 공정 일정표 (빈 서식)", cat: "PDF", fileSize: "0.2MB" },
  { title: "준공 검수 체크리스트", cat: "PDF", fileSize: "0.3MB" },
  { title: "자재 선택 기록표", cat: "XLSX", fileSize: "0.1MB" },
];

function todayIso() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

async function migrate() {
  const date = todayIso();
  const batch = db.batch();
  files.forEach((f, i) => {
    const ref = db.collection('resources').doc();
    batch.set(ref, {
      no: files.length - i,
      cat: f.cat,
      title: f.title,
      date,
      downloadUrl: "",
      fileSize: f.fileSize,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
  console.log('마이그레이션 완료: ' + files.length + '건 입력됨');
  console.log('downloadUrl은 빈 값으로 입력되었습니다.');
  console.log('Resources.dc.html의 관리자 등록 UI 또는 Firestore 콘솔에서');
  console.log('각 자료의 GitHub 다운로드 URL을 입력해 주십시오.');
  console.log('이제 serviceAccountKey.json을 삭제하고');
  console.log('Firebase 콘솔에서 해당 키를 폐기해 주십시오.');
}

migrate().catch((e) => {
  console.error('마이그레이션 실패:', e);
  process.exit(1);
});
