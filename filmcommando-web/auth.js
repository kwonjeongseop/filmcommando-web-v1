// 인증 공통 모듈 — 회원가입·로그인·로그아웃·관리자 체크
import { auth } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// 로그인 상태 캐시 (localStorage)
const CACHE_KEY = 'fc_user';
const ADMIN_KEY = 'fc_admin';

// 현재 로그인 사용자 캐시 조회
export function getCachedUser() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// 관리자 여부 캐시 조회
export function getCachedAdmin() {
  return localStorage.getItem(ADMIN_KEY) === 'true';
}

// 인증 상태 변경 감지 + 캐시 갱신
export function initAuthObserver(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdTokenResult();
      const isAdmin = token.claims.admin === true;
      localStorage.setItem(CACHE_KEY,
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));
      localStorage.setItem(ADMIN_KEY, isAdmin);
      callback({ user, isAdmin });
    } else {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(ADMIN_KEY);
      callback({ user: null, isAdmin: false });
    }
  });
}

// 회원가입
export async function signUp(email, password) {
  try {
    const cred = await
      createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (e) {
    return { success: false, error: e.code };
  }
}

// 로그인
export async function signIn(email, password) {
  try {
    const cred = await
      signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (e) {
    return { success: false, error: e.code };
  }
}

// 로그아웃
export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.code };
  }
}

// 로그인 가드 — 비로그인 시 Login.dc.html 이동
export function requireAuth() {
  const user = getCachedUser();
  if (!user) {
    window.location.href = './Login.dc.html';
    return false;
  }
  return true;
}

// 관리자 가드 — 비관리자 시 홈 이동
export function requireAdmin() {
  const user = getCachedUser();
  const isAdmin = getCachedAdmin();
  if (!user || !isAdmin) {
    window.location.href = './Home.dc.html';
    return false;
  }
  return true;
}
