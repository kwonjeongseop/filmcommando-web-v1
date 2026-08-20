# filmcommando 가비아 FTP 자동 배포 도구
import ftplib
import os
import sys
from pathlib import Path
from dotenv import dotenv_values

BASE_DIR = Path(sys.executable).parent \
           if getattr(sys, 'frozen', False) \
           else Path(__file__).parent.parent
SRC_DIR  = BASE_DIR / "filmcommando-web"
ENV_FILE = Path(sys.executable).parent / ".env" \
           if getattr(sys, 'frozen', False) \
           else BASE_DIR / ".env"

def load_config():
    if ENV_FILE.exists():
        cfg = dotenv_values(ENV_FILE)
        return cfg.get("FTP_HOST"), cfg.get("FTP_USER"), cfg.get("FTP_PASS")
    print("=== filmcommando 가비아 FTP 배포 도구 ===")
    host = input("FTP 호스트 (예: filmcommando.com): ").strip()
    user = input("FTP 아이디: ").strip()
    pw   = input("FTP 비밀번호: ").strip()
    return host, user, pw

def upload(ftp, local_path, remote_path):
    success, fail = [], []
    for f in local_path.iterdir():
        remote = f"{remote_path}/{f.name}"
        if f.is_dir():
            try:
                ftp.mkd(remote)
            except Exception:
                pass
            s, fa = upload(ftp, f, remote)
            success += s; fail += fa
        else:
            try:
                with open(f, "rb") as fp:
                    ftp.storbinary(f"STOR {remote}", fp)
                success.append(f.name)
                print(f"  ✔ {f.name}")
            except Exception as e:
                fail.append(f.name)
                print(f"  ✘ {f.name} — {e}")
    return success, fail

def main():
    host, user, pw = load_config()
    if not all([host, user, pw]):
        print("오류: 접속정보가 없습니다.")
        input("\n엔터를 누르면 종료합니다.")
        sys.exit(1)
    print(f"\n{host} 접속 중 (FTPS/TLS)...")
    try:
        ftp = ftplib.FTP_TLS(host, user, pw, timeout=30)
        ftp.encoding = "utf-8"
        ftp.prot_p()
        print("접속 성공 (암호화 연결). 업로드 시작...\n")
        success, fail = upload(ftp, SRC_DIR, "")
        ftp.quit()
        print(f"\n완료 — 성공 {len(success)}개 / 실패 {len(fail)}개")
        if fail:
            print("실패 목록:", ", ".join(fail))
    except Exception as e:
        print(f"접속 실패: {e}")
    input("\n엔터를 누르면 종료합니다.")

if __name__ == "__main__":
    main()
