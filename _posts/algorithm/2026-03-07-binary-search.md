---
title: Binary Search
date: 2026-03-07
category: Algorithm
tags: [algorithm, binary-search]
---

# Binary Search

이분 탐색(Binary Search)은 **정렬된 구간이나 단조적인 조건 위에서 정답을 절반씩 줄여 가며 찾는 알고리즘**이다.

한 줄로 요약하면 다음과 같다.

```text
정답 후보 구간을 매번 절반으로 줄이는 탐색 기법
```

---

## 1. 언제 쓰는가

문제에서 아래 표현이 보이면 이분 탐색을 떠올리면 된다.

- 정렬된 배열에서 값 찾기
- 특정 값 이상이 처음 나오는 위치
- 특정 값 이하가 마지막으로 나오는 위치
- 가능한 정답 범위가 크다
- 조건을 만족하는 최소값 / 최대값
- 어떤 기준으로 가능 / 불가능이 단조롭게 갈린다

---

## 2. 핵심 아이디어

이분 탐색의 핵심은 다음과 같다.

```text
mid를 기준으로 왼쪽 또는 오른쪽 절반만 남긴다
```

즉 전체를 다 보지 않고,
조건을 이용해 절반을 버린다.

---

## 3. 가장 중요한 전제: 단조성

이분 탐색은 아무 문제에나 되는 것이 아니다.
핵심 전제는 **단조성**이다.

예:

- 정렬된 배열에서 `arr[mid] < target`이면 왼쪽은 전부 버릴 수 있다
- 어떤 값 `x`가 가능하면 그보다 작은 값도 전부 가능하다
- 어떤 값 `x`가 불가능하면 그보다 큰 값도 전부 불가능하다

즉 경계가 하나로 나뉘어 있어야 한다.

```mermaid
flowchart LR
    A["불가능"] --> B["불가능"]
    B --> C["불가능"]
    C --> D["가능"]
    D --> E["가능"]
    E --> F["가능"]
```

이처럼 `불가능 -> 가능` 또는 `가능 -> 불가능`이 한 번만 바뀌면 이분 탐색이 가능하다.

---

## 4. 정렬된 배열에서 값 찾기

가장 기본적인 형태다.


```java
int binarySearch(int[] arr, int target) {
    int left = 0;
    int right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }

    return -1;
}
```

핵심:

- `left <= right`
- `mid` 계산
- 비교 후 구간 반으로 축소

---

## 5. Lower Bound와 Upper Bound

코테에서는 단순 탐색보다 경계 찾기가 더 자주 나온다.

### Lower Bound

```text
target 이상이 처음 나오는 위치
```

### Upper Bound

```text
target 초과가 처음 나오는 위치
```

이 두 개를 알면 다음이 가능하다.

- 특정 값의 개수 구하기
- 중복 원소 범위 찾기
- 삽입 위치 찾기

---

## 6. Lower Bound

```java
int lowerBound(int[] arr, int target) {
    int left = 0;
    int right = arr.length;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] >= target) right = mid;
        else left = mid + 1;
    }

    return left;
}
```

구간을 `[left, right)`로 잡는 형태다.

---

## 7. Upper Bound

```java
int upperBound(int[] arr, int target) {
    int left = 0;
    int right = arr.length;

    while (left < right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] > target) right = mid;
        else left = mid + 1;
    }

    return left;
}
```

특정 값 `x`의 개수는:

```java
upperBound(arr, x) - lowerBound(arr, x)
```

이다.

작은 예시로 보면 더 직관적이다.

배열:

```text
[1, 2, 2, 2, 5, 7]
```

에서

- `lowerBound(2)`는 인덱스 `1`
- `upperBound(2)`는 인덱스 `4`

가 된다.

즉 값 2의 개수는:

```text
4 - 1 = 3
```

이다.

이 감각이 익숙해지면 lower bound와 upper bound는
"경계 위치를 찾는 함수"로 자연스럽게 이해된다.

### 경계 불변식으로 이해하면 덜 틀린다

`lowerBound`를 `[left, right)` 형태로 구현할 때는
항상 다음 불변식을 유지한다고 생각하면 좋다.

- `0 .. left - 1` 구간은 이미 `target`보다 작다고 확정
- `right .. n - 1` 구간은 이미 `target` 이상이라고 확정
- 따라서 실제 정답 후보는 항상 `[left, right)` 안에만 남아 있다

```mermaid
flowchart LR
    A["확정 영역 < target"] --> B["후보 구간 [left, right)"]
    B --> C["확정 영역 >= target"]
```

이 관점에서 보면:

- `arr[mid] >= target`이면 `mid`도 정답 후보이므로 `right = mid`
- `arr[mid] < target`이면 `mid`는 탈락이므로 `left = mid + 1`

가 자연스럽게 나온다.

즉 `return left`가 맞는 이유도
"후보 구간이 한 칸으로 줄어든 지점"이기 때문이라고 이해하면 된다.

---

## 8. 정답을 찾는 이분 탐색 Parametric Search

이분 탐색은 배열에서 값 찾기에만 쓰지 않는다.
오히려 코테에서는 **정답 자체를 이분 탐색**하는 경우가 매우 많다.

문제 예시:

- 랜선 자르기
- 나무 자르기
- 가능한 최소 시간
- 가능한 최대 거리

핵심은 다음이다.

```text
x가 정답 후보일 때 가능 / 불가능을 판별할 수 있는가?
```

가능하다면, 그 조건이 단조적인지만 보면 된다.

이때 중요한 것은:

```text
정답 후보 하나를 잡았을 때
그 값이 가능한지 판별하는 함수 can(x)를 만들 수 있는가
```

이다.

배열에서 값을 찾는 이분 탐색은 `arr[mid]`와 비교하지만,
파라메트릭 서치는 `can(mid)`의 참/거짓으로 방향을 정한다.

---

## 9. Parametric Search 사고법

예를 들어 "높이를 h로 잘랐을 때 필요한 나무를 충분히 얻을 수 있는가"를 판별할 수 있다고 하자.

그러면:

- `h`가 낮으면 많이 얻는다 -> 가능
- `h`가 높으면 적게 얻는다 -> 불가능

즉 `가능 -> 불가능` 경계가 하나 생긴다.

이 경계를 이분 탐색으로 찾는 것이다.

손으로 따라가 보자.

나무 높이가 `[20, 15, 10, 17]`이고,
필요한 길이가 `7`이라고 하자.

- `h = 15`면 얻는 길이 = `5 + 0 + 0 + 2 = 7` -> 가능
- `h = 16`이면 얻는 길이 = `4 + 0 + 0 + 1 = 5` -> 불가능

즉 정답은 `15`라는 것을 경계 탐색으로 찾을 수 있다.

---

## 10. Parametric Search

```java
long binarySearchAnswer(long left, long right) {
    long answer = -1;

    while (left <= right) {
        long mid = left + (right - left) / 2;

        if (can(mid)) {
            answer = mid;
            left = mid + 1;   // 더 큰 쪽도 가능한지 확인
        } else {
            right = mid - 1;
        }
    }

    return answer;
}
```

이 방식은 "가능한 최대값"을 찾을 때 자주 쓴다.

"가능한 최소값"을 찾고 싶으면 갱신 방향이 반대가 된다.

---

## 11. 최소값 / 최대값 찾기 구분

### 가능한 최대값 찾기

- `can(mid) == true`면 더 큰 쪽을 본다
- `left = mid + 1`

### 가능한 최소값 찾기

- `can(mid) == true`면 더 작은 쪽도 가능한지 본다
- `right = mid - 1`

즉,

```text
정답을 키우고 싶은가, 줄이고 싶은가
```

를 먼저 정해야 한다.

실전에서는 이것만 명확하면 구현이 크게 단순해진다.

- 가능한 최대값을 찾는가?
- 가능한 최소값을 찾는가?

이 둘을 먼저 종이에 적어 두면 `left`, `right` 갱신을 덜 틀린다.

---

## 12. 왜 `mid = left + (right - left) / 2` 를 쓰는가

단순히 `(left + right) / 2`도 되지만,
정수 범위가 크면 overflow 가능성이 있다.

그래서 안전하게:

```java
int mid = left + (right - left) / 2;
```

를 쓰는 습관이 좋다.

추가로 이분 탐색은 구간 표현도 통일해야 덜 틀린다.

- 값 찾기 기본형: 보통 `[left, right]`
- lower/upper bound: 보통 `[left, right)`

이 두 스타일을 섞으면 off-by-one 실수가 매우 자주 난다.

---

## 13. 자주 하는 실수

- 정렬 안 된 배열에 이분 탐색 사용
- 단조성이 없는 문제를 억지로 이분 탐색
- `left`, `right`, `mid` 업데이트 실수
- `<=` 와 `<` 조건 혼동
- lower bound / upper bound 경계 헷갈림
- 정답 저장 위치를 잘못 둠

---

## 14. 시험장용 최소 암기 버전

```text
이분 탐색:
단조성 + 절반씩 줄이기

기본:
정렬된 배열에서 값 찾기

확장:
정답 자체를 이분 탐색

핵심 질문:
can(mid)를 만들 수 있는가?
조건이 한 번만 바뀌는가?
```

---

## 15. 최종 요약

이분 탐색은 다음 문장으로 정리할 수 있다.

```text
정답 후보 구간을 절반씩 줄이며
단조적인 경계를 찾는 탐색 기법
```
