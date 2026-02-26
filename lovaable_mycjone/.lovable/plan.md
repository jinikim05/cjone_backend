
## 변경 사항

### 1. 초기 카드를 `final.png` 이미지로 교체
- `src/components/ClubSection.tsx`의 `state === "initial"` 영역을 수정
- 기존 그라디언트 배경 + 텍스트 대신, Storage의 `image/final.png` 이미지를 카드 전체에 표시
- 이미지 클릭 시 `handleAnalyze` 실행 (기존과 동일)
- 카드의 `background`, `padding`, `minHeight` 등을 조정하여 이미지가 카드 전체를 채우도록 처리

### 2. 페이지 전환 후에도 클럽 상태 유지
- 현재 `useState`로 관리되는 `state`, `selectedClub` 값은 페이지 이동 시 초기화됨
- `sessionStorage`를 활용하여 `state`와 `selectedClub`(id)을 저장
- 컴포넌트 마운트 시 `sessionStorage`에서 복원
- `state` 변경 시마다 `sessionStorage`에 저장
- 탈퇴(handleLeave) 시 `sessionStorage` 클리어

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/ClubSection.tsx` | 초기 카드를 final.png 이미지로 교체, sessionStorage로 상태 유지 |

### 기술 상세

**이미지 URL**: `https://wkkbmehiznsmeemplxpe.supabase.co/storage/v1/object/public/image/final.png`

**상태 유지 로직**:
- `useState` 초기값을 `sessionStorage`에서 읽어오는 함수로 설정
- `state` 변경 시 `useEffect`로 `sessionStorage`에 기록
- `selectedClub`은 club id만 저장하고, 마운트 시 `ALL_CLUBS`에서 매칭하여 복원

**loading/revealed/benefits 상태는 수정하지 않음**
