---
title: Kotlin으로 코테 준비할 때 알아야 할 것들
date: 2026-04-02
category: Tips
tags: [kotlin, algorithm, coding-test]
toc: true
---

# Kotlin으로 코테 준비할 때 알아야 할 것들

`algo` 폴더의 Java 풀이 49개를 전체로 보면 반복해서 나오는 패턴이 분명하다.

- 그래프 탐색: `BOJ_1697_숨바꼭질`, `BOJ_4179_불!`, `BOJ_1175_배달`
- DP: `BOJ_1520_내리막길`, `BOJ_2579_계단오르기`, `BOJ_2253_점프`
- 이분 탐색: `BOJ_2110_공유기설치`, `BOJ_17266_어두운굴다리`, `BOJ_2512_예산`
- 우선순위 큐: `BOJ_1927_최소힙`, `BOJ_1655_가운데를말해요`, `BOJ_4485_녹색옷입은애가젤다지`
- 스택: `BOJ_17298_오큰수`, `BOJ_2493_탑`, `BOJ_1863_스카이라인쉬운거`
- 투 포인터/슬라이딩 윈도우: `BOJ_2467_용액`, `BOJ_21921_블로그`
- 유니온 파인드: `BOJ_16562_친구비`, `BOJ_1976_여행가자`, `BOJ_2653_안정된집단`
- 백트래킹/완전탐색: `BOJ_1987_알파벳`, `BOJ_18430_무기공학`, `BOJ_1941_소문난칠공주`

그래서 Kotlin 코테 준비는 문법 공부 자체보다, 이런 유형을 Kotlin으로 안정적으로 옮기는 훈련이 핵심이다.

이번 글은 그 기준으로 정리한다.

---

## Kotlin으로 코테를 준비할 때의 기본 방향

Kotlin은 Java보다 짧게 쓸 수 있지만, 코테에서는 "예쁘게" 쓰는 것보다 "안정적으로" 쓰는 것이 더 중요하다.

핵심 기준은 이 정도면 충분하다.

- 숫자 자료는 `IntArray`, `LongArray`, `BooleanArray` 우선
- 상태 표현은 `data class` 또는 작은 클래스 사용
- 출력은 `StringBuilder` 사용
- 컬렉션은 필요한 만큼만 사용하고, 배열 기반 풀이를 우선
- `map`, `filter`, `groupBy`보다 반복문과 인덱스 기반 구현에 익숙해지기

예를 들어 Java에서 comparator가 길어지는 코드는 Kotlin에서 훨씬 간단해진다.

```java
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
```

```kotlin
val pq = PriorityQueue<IntArray>(compareBy { it[0] })
```

즉 Kotlin의 장점은 알고리즘이 달라지는 것이 아니라, 같은 알고리즘을 더 짧고 덜 실수하게 쓰는 데 있다.

---

## 코테에서 바로 써야 하는 Kotlin 문법 최소 셋

### 배열

```kotlin
val arr = IntArray(n)
val dist = IntArray(100001) { -1 }
val visited = BooleanArray(n)
val board = Array(n) { IntArray(m) }
```

### 반복문

```kotlin
for (i in 0 until n) {
    println(i)
}

for (i in n - 1 downTo 0) {
    println(i)
}

repeat(t) {
    println("case")
}
```

### 분기

```kotlin
val result = when {
    x < 0 -> "negative"
    x == 0 -> "zero"
    else -> "positive"
}
```

### 정렬

```kotlin
arr.sort()

val items = mutableListOf<Pair<Int, Int>>()
items.sortBy { it.first }
items.sortWith(compareBy<Pair<Int, Int>> { it.first }.thenBy { it.second })
```

### 문자열과 출력

```kotlin
val s = "abcde"
val c = s[0]
val sub = s.substring(1, 3)

val sb = StringBuilder()
sb.append(10).append('\n')
print(sb)
```

---

## Java 풀이를 Kotlin으로 옮길 때 자주 바꾸는 패턴

### `static` 필드와 메서드

Java:

```java
static int n;
static int[] arr;

public static void go() { }
```

Kotlin:

```kotlin
private var n = 0
private lateinit var arr: IntArray

private fun go() {
}
```

### 배열 타입

```kotlin
val arr = IntArray(n)
val cost = LongArray(n)
val visited = BooleanArray(n)
```

### 큐와 스택

```kotlin
val q = ArrayDeque<Int>()
q.addLast(1)
val first = q.removeFirst()

val stack = ArrayDeque<Int>()
stack.addLast(3)
val top = stack.removeLast()
```

### 우선순위 큐

```kotlin
import java.util.PriorityQueue

val minHeap = PriorityQueue<Int>()
val maxHeap = PriorityQueue<Int>(compareByDescending { it })
val pq = PriorityQueue<State>(compareBy<State> { it.cost }.thenBy { it.x })
```

### 합계는 `Long` 먼저 의심

```kotlin
var sum = 0L
for (x in arr) sum += x
```

### 실전에서는 함수형 스타일을 줄이기

```kotlin
for (i in 0 until n) {
    arr[i] = nextInt()
}
```

코테에서는 이쪽이 더 낫다.

- 중간 객체가 덜 생긴다.
- 성능이 읽기 쉽다.
- 디버깅이 단순하다.

---

## 그래프를 만났을 때 가장 먼저 정해야 하는 것

코테에서 그래프 문제는 "탐색을 어떻게 하느냐"보다 먼저 "그래프를 어떤 형태로 저장하느냐"가 중요하다.

### 1. 인접 행렬

정점 수가 작고, 두 정점의 직접 연결 여부를 자주 확인해야 하면 인접 행렬이 편하다.

```kotlin
val n = 5
val graph = Array(n) { IntArray(n) }

graph[0][1] = 1
graph[1][0] = 1
```

장점:

- `graph[a][b]`로 바로 확인 가능
- 구현이 단순함

단점:

- 메모리를 많이 쓴다
- 간선이 적은 희소 그래프에서는 비효율적이다

### 2. 인접 리스트

정점 수가 크고 간선 수가 상대적으로 적으면 인접 리스트가 기본이다.

```kotlin
val n = 5
val graph = Array(n) { mutableListOf<Int>() }

graph[0].add(1)
graph[1].add(0)
graph[1].add(2)
```

가중치가 있으면 이렇게 둔다.

```kotlin
data class Edge(val to: Int, val cost: Int)

val graph = Array(n) { mutableListOf<Edge>() }
graph[0].add(Edge(1, 3))
graph[0].add(Edge(2, 7))
```

실전에서는 대부분 인접 리스트를 먼저 떠올리면 된다.

---

## 구현과 시뮬레이션도 절대 빼면 안 된다

코테를 준비할 때 BFS, DP 같은 이름 있는 알고리즘에만 집중하기 쉬운데, 실제로는 구현/시뮬레이션 비중도 꽤 높다.  
`BOJ_1244_스위치켜고끄기`, `BOJ_16926_배열돌리기1`, `BOJ_16927_배열돌리기2`, `BOJ_2138_전구와스위치` 같은 문제들이 이 축에 가깝다.

이 유형은 보통 이런 특징이 있다.

- 문제 설명이 길다
- 조건 분기가 많다
- 자료구조보다 인덱스 처리와 예외 처리가 중요하다

구현 문제에서 먼저 체크할 것:

- 좌표가 0-index인지 1-index인지
- 회전, 반전, 이동 순서가 정확한지
- 원본 배열을 바로 바꿔도 되는지
- 한 번의 연산이 끝난 뒤 상태를 갱신하는지, 즉시 반영하는지

예를 들어 방향 이동은 이런 식으로 틀을 고정해 두면 좋다.

```kotlin
val dx = intArrayOf(-1, 0, 1, 0)
val dy = intArrayOf(0, 1, 0, -1)

for (dir in 0 until 4) {
    val nx = x + dx[dir]
    val ny = y + dy[dir]
}
```

문제 풀이가 안 풀릴 때 알고리즘 부족이 아니라 구현 순서가 꼬인 경우도 많다.  
이럴 때는 연산 하나를 함수로 쪼개고, 작은 입력을 손으로 추적하는 게 가장 빠르다.

---

## DFS와 BFS

그래프를 저장했다면 다음은 탐색이다.  
`algo` 폴더 기준으로도 가장 자주 나오는 축이 이 부분이다.

### DFS

연결 요소 탐색, 경로 존재 여부, 백트래킹 기반 완전 탐색과 잘 맞는다.

```kotlin
private lateinit var graph: Array<MutableList<Int>>
private lateinit var visited: BooleanArray

fun dfs(cur: Int) {
    visited[cur] = true

    for (next in graph[cur]) {
        if (!visited[next]) {
            dfs(next)
        }
    }
}
```

언제 떠올리면 좋은가:

- 연결 요소 개수 세기
- 모든 경로/상태를 재귀적으로 탐색
- 트리 순회

### BFS

간선 비용이 모두 같을 때 최단 거리 문제에 특히 강하다.

```kotlin
data class State(val x: Int, val dist: Int)

fun hideAndSeek(start: Int, target: Int): Int {
    if (start == target) return 0

    val max = 100000
    val visited = BooleanArray(max + 1)
    val q = ArrayDeque<State>()

    q.addLast(State(start, 0))
    visited[start] = true

    while (q.isNotEmpty()) {
        val (x, dist) = q.removeFirst()

        val nexts = intArrayOf(x - 1, x + 1, x * 2)
        for (nx in nexts) {
            if (nx !in 0..max || visited[nx]) continue
            if (nx == target) return dist + 1

            visited[nx] = true
            q.addLast(State(nx, dist + 1))
        }
    }

    return -1
}
```

언제 떠올리면 좋은가:

- 최단 이동 횟수
- 격자 탐색
- 불, 물, 바이러스처럼 "시간 단위로 퍼지는" 문제

### 격자 탐색

```kotlin
val dx = intArrayOf(-1, 0, 1, 0)
val dy = intArrayOf(0, 1, 0, -1)
```

`BOJ_4179_불!`처럼 두 종류의 시간 배열을 따로 관리하는 문제도 자주 나온다.

---

## 그래프 문제를 넓게 대비하려면 알아야 하는 것들

### 1. 최단 경로

#### BFS

간선 비용이 모두 같을 때.

#### Dijkstra

간선 비용이 양수이고, 최소 비용 경로를 구할 때.

```kotlin
import java.util.PriorityQueue

data class Edge(val to: Int, val cost: Int)
data class Node(val v: Int, val dist: Int)

fun dijkstra(start: Int, graph: Array<MutableList<Edge>>): IntArray {
    val n = graph.size
    val dist = IntArray(n) { Int.MAX_VALUE }
    val pq = PriorityQueue<Node>(compareBy { it.dist })

    dist[start] = 0
    pq.offer(Node(start, 0))

    while (pq.isNotEmpty()) {
        val (cur, curDist) = pq.poll()
        if (curDist > dist[cur]) continue

        for ((next, cost) in graph[cur]) {
            val nd = curDist + cost
            if (nd < dist[next]) {
                dist[next] = nd
                pq.offer(Node(next, nd))
            }
        }
    }

    return dist
}
```

#### Floyd-Warshall

정점 수가 작고, 모든 정점 쌍 사이 최단 거리가 필요할 때.

```kotlin
val dist = Array(n) { IntArray(n) { INF } }

for (i in 0 until n) dist[i][i] = 0

for (k in 0 until n) {
    for (i in 0 until n) {
        for (j in 0 until n) {
            dist[i][j] = minOf(dist[i][j], dist[i][k] + dist[k][j])
        }
    }
}
```

#### 0-1 BFS

간선 비용이 `0` 또는 `1`만 나오는 문제는 Dijkstra보다 0-1 BFS가 더 직접적일 때가 많다.

```kotlin
data class Edge01(val to: Int, val cost: Int)

fun zeroOneBfs(start: Int, graph: Array<MutableList<Edge01>>): IntArray {
    val dist = IntArray(graph.size) { Int.MAX_VALUE }
    val dq = ArrayDeque<Int>()

    dist[start] = 0
    dq.addFirst(start)

    while (dq.isNotEmpty()) {
        val cur = dq.removeFirst()

        for ((next, cost) in graph[cur]) {
            val nd = dist[cur] + cost
            if (nd >= dist[next]) continue

            dist[next] = nd
            if (cost == 0) dq.addFirst(next)
            else dq.addLast(next)
        }
    }

    return dist
}
```

문제에서 "벽을 부수면 1, 그냥 가면 0" 같은 식으로 가중치가 두 종류만 나오면 떠올릴 만하다.

### 2. 위상 정렬

DAG에서 선후 관계가 있을 때 쓴다.  
과목 선수 조건, 작업 순서, 빌드 순서 같은 문제가 전형적이다.

```kotlin
fun topologicalSort(graph: Array<MutableList<Int>>, indegree: IntArray): List<Int> {
    val q = ArrayDeque<Int>()
    val result = mutableListOf<Int>()

    for (i in indegree.indices) {
        if (indegree[i] == 0) q.addLast(i)
    }

    while (q.isNotEmpty()) {
        val cur = q.removeFirst()
        result.add(cur)

        for (next in graph[cur]) {
            indegree[next]--
            if (indegree[next] == 0) q.addLast(next)
        }
    }

    return result
}
```

### 3. 유니온 파인드

연결 여부, 그룹 묶기, 사이클 확인에 매우 자주 쓰인다.

```kotlin
private lateinit var parent: IntArray

fun makeSet(n: Int) {
    parent = IntArray(n + 1) { it }
}

fun find(x: Int): Int {
    if (parent[x] == x) return x
    parent[x] = find(parent[x])
    return parent[x]
}

fun union(a: Int, b: Int) {
    val pa = find(a)
    val pb = find(b)
    if (pa != pb) parent[pb] = pa
}
```

이걸 알면 `친구비`, `여행가자` 같은 문제에서 훨씬 빨라진다.

유니온 파인드에서 같이 익혀두면 좋은 포인트:

- 두 정점이 같은 그룹인지 확인: `find(a) == find(b)`
- 서로 다른 그룹일 때만 합치기
- 간선을 보면서 `find(a) == find(b)`면 사이클 후보로 보기
- 대표 원소에 비용, 크기 같은 정보를 연결하기

예를 들어 union 결과를 `Boolean`으로 돌려주면 실전에서 편하다.

```kotlin
fun union(a: Int, b: Int): Boolean {
    val pa = find(a)
    val pb = find(b)
    if (pa == pb) return false

    parent[pb] = pa
    return true
}
```

이 형태는 Kruskal에서 특히 자주 쓴다.

### 4. MST

모든 정점을 최소 비용으로 연결해야 하면 MST를 의심한다.

- Kruskal: 간선 정렬 + 유니온 파인드
- Prim: 우선순위 큐 기반 확장

코테에서는 Kruskal 쪽이 더 자주 손에 익는다.

---

## 트리 문제는 그래프와 비슷하지만 시선이 조금 다르다

트리는 결국 그래프의 특수한 형태지만, 코테에서는 따로 감을 잡아두는 편이 좋다.

자주 나오는 축은 이렇다.

- 부모 찾기
- depth 계산
- subtree 크기
- 전위/중위/후위 순회
- LCA까지 이어지는 확장

기본 인접 리스트는 그래프와 같다.

```kotlin
val tree = Array(n + 1) { mutableListOf<Int>() }
```

부모와 깊이를 구하는 기본 DFS는 이렇게 둔다.

```kotlin
private lateinit var tree: Array<MutableList<Int>>
private lateinit var parent: IntArray
private lateinit var depth: IntArray

fun dfs(cur: Int, prev: Int) {
    parent[cur] = prev

    for (next in tree[cur]) {
        if (next == prev) continue
        depth[next] = depth[cur] + 1
        dfs(next, cur)
    }
}
```

트리 문제를 만나면 먼저 이것부터 생각하면 된다.

```text
루트가 정해져 있는가?
부모/자식 관계가 필요한가?
경로 문제인가, 서브트리 문제인가?
```

---

## DP는 결국 상태 정의 싸움이다

`BOJ_1520_내리막길`, `BOJ_2579_계단오르기`, `BOJ_2253_점프`를 보면 DP는 Kotlin에서도 중요하다.

DP를 볼 때는 먼저 이 질문부터 하면 된다.

```text
dp[i] 또는 dp[i][j]가 정확히 무엇을 의미하는가?
```

### 1차원 DP

```kotlin
val dp = IntArray(n + 1)
dp[1] = 1

for (i in 2..n) {
    dp[i] = dp[i - 1] + dp[i - 2]
}
```

### 2차원 DP

```kotlin
val dp = Array(n) { IntArray(m) }
```

### DFS + Memo

```kotlin
private lateinit var board: Array<IntArray>
private lateinit var memo: Array<IntArray>
private var n = 0
private var m = 0
private val dx = intArrayOf(-1, 0, 1, 0)
private val dy = intArrayOf(0, 1, 0, -1)

fun dfs(x: Int, y: Int): Int {
    if (x == n - 1 && y == m - 1) return 1
    if (memo[x][y] != -1) return memo[x][y]

    memo[x][y] = 0
    for (dir in 0 until 4) {
        val nx = x + dx[dir]
        val ny = y + dy[dir]
        if (nx !in 0 until n || ny !in 0 until m) continue
        if (board[nx][ny] >= board[x][y]) continue
        memo[x][y] += dfs(nx, ny)
    }
    return memo[x][y]
}
```

DP에서 실수 줄이는 기준:

- 상태 의미를 한 문장으로 적기
- 초기값을 먼저 정하기
- 점화식을 쓰기 전에 작은 예시로 검증하기
- 값 범위를 보고 `Int`인지 `Long`인지 결정하기

### LIS

최장 증가 부분 수열도 코테에서 매우 자주 나온다.  
기본 `O(N^2)` DP도 알아야 하지만, `O(N log N)` 풀이 감각도 같이 잡아두는 편이 좋다.

```kotlin
fun lisLength(arr: IntArray): Int {
    val lis = mutableListOf<Int>()

    for (x in arr) {
        var left = 0
        var right = lis.size

        while (left < right) {
            val mid = (left + right) / 2
            if (lis[mid] < x) left = mid + 1
            else right = mid
        }

        if (left == lis.size) lis.add(x)
        else lis[left] = x
    }

    return lis.size
}
```

이 풀이를 이해해 두면 LIS 자체뿐 아니라 "증가하는 구조 유지 + lower bound" 감각도 같이 얻을 수 있다.

### 조합론과 `nCr`

경우의 수 문제에서는 조합 값을 직접 써야 하는 경우가 많다.

작은 범위면 DP로 안전하게 만들 수 있다.

```kotlin
fun comb(n: Int, r: Int): Long {
    val dp = Array(n + 1) { LongArray(r + 1) }

    for (i in 0..n) {
        val limit = minOf(i, r)
        for (j in 0..limit) {
            dp[i][j] = when {
                j == 0 || j == i -> 1L
                else -> dp[i - 1][j - 1] + dp[i - 1][j]
            }
        }
    }

    return dp[n][r]
}
```

이항계수는 다음 상황에서 자주 나온다.

- 조합 개수 세기
- 부분집합 개수 계산
- 경우의 수 DP의 기초 값

범위가 크면 모듈러 연산, 팩토리얼, 역원까지 이어질 수 있다.

---

## 이분 탐색은 배열 탐색보다 정답 탐색이 더 중요하다

`BOJ_2110_공유기설치` 같은 문제는 "값을 찾는 이분 탐색"보다 "가능한 정답의 최댓값/최솟값을 찾는 탐색"이다.

```kotlin
fun canPlace(house: IntArray, gap: Int, need: Int): Boolean {
    var count = 1
    var prev = house[0]

    for (i in 1 until house.size) {
        if (house[i] - prev >= gap) {
            count++
            prev = house[i]
        }
    }

    return count >= need
}

fun solve(house: IntArray, c: Int): Int {
    house.sort()

    var left = 1
    var right = house.last() - house.first()
    var answer = 0

    while (left <= right) {
        val mid = (left + right) / 2

        if (canPlace(house, mid, c)) {
            answer = mid
            left = mid + 1
        } else {
            right = mid - 1
        }
    }

    return answer
}
```

이분 탐색을 떠올리는 질문:

```text
어떤 값 x가 가능하면, 그보다 작은 값 또는 큰 값도 한쪽으로 쭉 가능한가?
```

이 단조성이 보이면 파라메트릭 서치를 의심하면 된다.

---

## 스택, 큐, 덱, 우선순위 큐는 반드시 손에 익혀야 한다

### 스택

`BOJ_17298_오큰수`, `BOJ_2493_탑`처럼 단조 스택 문제가 자주 나온다.

```kotlin
fun nextGreater(arr: IntArray): IntArray {
    val answer = IntArray(arr.size) { -1 }
    val stack = ArrayDeque<Int>()

    for (i in arr.indices) {
        while (stack.isNotEmpty() && arr[stack.last()] < arr[i]) {
            answer[stack.removeLast()] = arr[i]
        }
        stack.addLast(i)
    }

    return answer
}
```

### 큐

BFS의 기본 도구다.

### 덱

양쪽 삽입/삭제가 필요할 때 쓴다.  
슬라이딩 윈도우 최소/최대, 0-1 BFS에서도 자주 나온다.

### 우선순위 큐

최소값/최댓값을 계속 꺼내야 하면 거의 바로 등장한다.

```kotlin
val minHeap = PriorityQueue<Int>()
val maxHeap = PriorityQueue<Int>(compareByDescending { it })
```

---

## 투 포인터, 슬라이딩 윈도우, 누적 합도 자주 나온다

### 투 포인터

`BOJ_2467_용액`처럼 정렬된 배열 양 끝에서 조건을 맞춘다.

```kotlin
fun closestToZero(arr: LongArray): Pair<Long, Long> {
    var left = 0
    var right = arr.lastIndex
    var best = Long.MAX_VALUE
    var ansL = arr[left]
    var ansR = arr[right]

    while (left < right) {
        val sum = arr[left] + arr[right]
        val absSum = kotlin.math.abs(sum)

        if (absSum < best) {
            best = absSum
            ansL = arr[left]
            ansR = arr[right]
        }

        if (sum < 0) left++
        else right--
    }

    return ansL to ansR
}
```

### 슬라이딩 윈도우

`BOJ_21921_블로그` 같은 고정 길이 구간 합에서 자주 쓴다.

```kotlin
fun maxWindowSum(arr: IntArray, k: Int): Pair<Long, Int> {
    var sum = 0L
    for (i in 0 until k) sum += arr[i]

    var maxSum = sum
    var count = 1

    for (i in k until arr.size) {
        sum += arr[i]
        sum -= arr[i - k]

        if (sum > maxSum) {
            maxSum = sum
            count = 1
        } else if (sum == maxSum) {
            count++
        }
    }

    return maxSum to count
}
```

### 누적 합

구간 합 문제에서 가장 먼저 떠올려야 한다.

```kotlin
val prefix = LongArray(n + 1)
for (i in 0 until n) {
    prefix[i + 1] = prefix[i] + arr[i]
}

val sum = prefix[r + 1] - prefix[l]
```

## 펜윅 트리와 세그먼트 트리도 후반부에는 필요하다

구간 합/구간 최솟값/점 갱신 문제가 반복되기 시작하면 누적 합만으로는 부족하다.  
그때 등장하는 대표 도구가 펜윅 트리와 세그먼트 트리다.

### 펜윅 트리

점 업데이트 + prefix sum에 강하다.

```kotlin
class Fenwick(private val n: Int) {
    private val tree = LongArray(n + 1)

    fun add(index: Int, delta: Long) {
        var i = index
        while (i <= n) {
            tree[i] += delta
            i += i and -i
        }
    }

    fun sum(index: Int): Long {
        var i = index
        var res = 0L
        while (i > 0) {
            res += tree[i]
            i -= i and -i
        }
        return res
    }

    fun rangeSum(left: Int, right: Int): Long = sum(right) - sum(left - 1)
}
```

### 세그먼트 트리

구간 연산이 더 일반적일 때 쓴다.

```kotlin
class SegmentTree(private val arr: IntArray) {
    private val tree = IntArray(arr.size * 4)

    init {
        build(1, 0, arr.lastIndex)
    }

    private fun build(node: Int, start: Int, end: Int) {
        if (start == end) {
            tree[node] = arr[start]
            return
        }

        val mid = (start + end) / 2
        build(node * 2, start, mid)
        build(node * 2 + 1, mid + 1, end)
        tree[node] = tree[node * 2] + tree[node * 2 + 1]
    }

    fun query(node: Int, start: Int, end: Int, left: Int, right: Int): Int {
        if (right < start || end < left) return 0
        if (left <= start && end <= right) return tree[node]

        val mid = (start + end) / 2
        return query(node * 2, start, mid, left, right) +
            query(node * 2 + 1, mid + 1, end, left, right)
    }
}
```

입문 단계에서는 펜윅 트리가 더 가볍고, 세그먼트 트리는 응용 범위가 더 넓다.

---

## 문자열, 해시, 비트마스킹도 자주 나온다

`algo` 폴더에서도 문자열 문제와 알파벳/상태 관리 문제가 적지 않다.  
이 축은 구현이 짧아서 방심하기 쉽지만, 실전에서는 은근히 많이 나온다.

### 문자열

문자열 문제에서 자주 쓰는 도구:

- `CharArray`
- 문자 빈도 배열
- `StringBuilder`
- 정렬 후 비교

예를 들어 알파벳 개수 세기는 이렇게 간단하다.

```kotlin
val count = IntArray(26)
for (ch in s) {
    count[ch - 'a']++
}
```

문자열을 자주 수정해야 하면 `String`을 계속 더하기보다 `StringBuilder`가 낫다.

### 해시

중복 제거, 등장 여부, 개수 세기는 해시가 기본이다.

```kotlin
val set = hashSetOf<String>()
val map = hashMapOf<String, Int>()

for (word in words) {
    map[word] = (map[word] ?: 0) + 1
}
```

### 비트마스킹

선택 여부를 압축해서 표현해야 할 때 강하다.

- 부분집합 탐색
- 방문 상태 관리
- 알파벳 사용 여부

```kotlin
for (mask in 0 until (1 shl n)) {
    var sum = 0
    for (i in 0 until n) {
        if ((mask and (1 shl i)) != 0) {
            sum += arr[i]
        }
    }
}
```

알파벳 방문 여부도 `BooleanArray(26)` 대신 비트로 줄일 수 있다.

```kotlin
val bit = 1 shl (ch - 'A')
if ((mask and bit) == 0) {
    dfs(nx, ny, mask or bit)
}
```

### KMP

패턴 문자열을 빠르게 찾는 대표 알고리즘이다.  
문자열 검색, 접두사/접미사 길이 활용 문제에서 등장한다.

```kotlin
fun prefixFunction(pattern: String): IntArray {
    val pi = IntArray(pattern.length)
    var j = 0

    for (i in 1 until pattern.length) {
        while (j > 0 && pattern[i] != pattern[j]) j = pi[j - 1]
        if (pattern[i] == pattern[j]) pi[i] = ++j
    }

    return pi
}
```

KMP는 "문자열을 다시 처음부터 비교하지 않는다"는 감각이 핵심이다.

### Trie

문자열 집합을 저장하고, 접두사 검색을 빠르게 해야 할 때 쓴다.

```kotlin
class TrieNode {
    val next = HashMap<Char, TrieNode>()
    var end = false
}

class Trie {
    private val root = TrieNode()

    fun insert(word: String) {
        var cur = root
        for (ch in word) {
            cur = cur.next.getOrPut(ch) { TrieNode() }
        }
        cur.end = true
    }

    fun startsWith(prefix: String): Boolean {
        var cur = root
        for (ch in prefix) {
            cur = cur.next[ch] ?: return false
        }
        return true
    }
}
```

전화번호 목록, 문자열 집합, 자동완성 같은 문제군에서 자주 보인다.

---

## 순열, 조합, 부분집합은 완전탐색의 기본기다

백트래킹 문제를 풀다 보면 결국 순열, 조합, 부분집합 중 하나로 귀결되는 경우가 많다.  
그래서 이 세 가지는 따로 손에 익혀두는 편이 좋다.

### 순열

순서가 중요할 때 쓴다.

```kotlin
private lateinit var arr: IntArray
private lateinit var used: BooleanArray
private lateinit var out: IntArray

fun permutation(depth: Int, r: Int) {
    if (depth == r) {
        println(out.joinToString(" "))
        return
    }

    for (i in arr.indices) {
        if (used[i]) continue
        used[i] = true
        out[depth] = arr[i]
        permutation(depth + 1, r)
        used[i] = false
    }
}
```

### 조합

순서가 중요하지 않을 때 쓴다.

```kotlin
private lateinit var arr: IntArray
private lateinit var out: IntArray

fun combination(start: Int, depth: Int, r: Int) {
    if (depth == r) {
        println(out.joinToString(" "))
        return
    }

    for (i in start until arr.size) {
        out[depth] = arr[i]
        combination(i + 1, depth + 1, r)
    }
}
```

### 부분집합

각 원소를 뽑는다/안 뽑는다로 나누는 기본형이다.

```kotlin
private lateinit var arr: IntArray
private lateinit var selected: BooleanArray

fun subset(depth: Int) {
    if (depth == arr.size) {
        val result = mutableListOf<Int>()
        for (i in arr.indices) {
            if (selected[i]) result.add(arr[i])
        }
        println(result.joinToString(" "))
        return
    }

    selected[depth] = true
    subset(depth + 1)

    selected[depth] = false
    subset(depth + 1)
}
```

실전에서 구분하는 기준은 간단하다.

```text
순서가 중요하면 순열
몇 개를 고르되 순서는 무시하면 조합
고른다/안 고른다 전체 경우를 보면 부분집합
```

백트래킹이 막힐 때는 이 셋 중 무엇인지 먼저 이름을 붙이면 훨씬 빨리 풀린다.

---

## 백트래킹은 "선택 -> 진행 -> 복구" 패턴으로 익히기

`BOJ_1987_알파벳`, `BOJ_18430_무기공학`, `BOJ_1941_소문난칠공주` 같은 문제는 백트래킹 감각이 중요하다.

핵심은 이 세 단계다.

```text
선택한다 -> 다음 상태로 들어간다 -> 원상복구한다
```

가장 기본형은 이렇다.

```kotlin
private lateinit var used: BooleanArray
private lateinit var arr: IntArray
private var answer = 0

fun backtrack(depth: Int, sum: Int) {
    if (depth == arr.size) {
        answer = maxOf(answer, sum)
        return
    }

    if (!used[depth]) {
        used[depth] = true
        backtrack(depth + 1, sum + arr[depth])
        used[depth] = false
    }

    backtrack(depth + 1, sum)
}
```

알파벳 문제처럼 방문한 문자를 관리할 수도 있다.

```kotlin
private lateinit var board: Array<CharArray>
private val dx = intArrayOf(-1, 0, 1, 0)
private val dy = intArrayOf(0, 1, 0, -1)
private val used = BooleanArray(26)
private var best = 0

fun dfs(x: Int, y: Int, depth: Int) {
    best = maxOf(best, depth)

    for (dir in 0 until 4) {
        val nx = x + dx[dir]
        val ny = y + dy[dir]
        if (nx !in board.indices || ny !in board[0].indices) continue

        val idx = board[nx][ny] - 'A'
        if (used[idx]) continue

        used[idx] = true
        dfs(nx, ny, depth + 1)
        used[idx] = false
    }
}
```

백트래킹에서 중요한 기준:

- 가지치기 조건이 있는가
- 방문/선택 상태를 어떻게 표현할 것인가
- 복구를 빠뜨리지 않았는가

---

## Kotlin으로 코테 준비할 때 특히 조심할 점

### `Pair` 남발

작은 예제에서는 편하지만 실전에서는 필드 의미가 흐려진다.

```kotlin
data class State(val x: Int, val y: Int, val dist: Int)
```

처럼 이름 있는 상태가 더 안전하다.

### 박싱된 컬렉션 남발

```kotlin
val arr = IntArray(n)
val list = MutableList(n) { 0 }
```

숫자 문제는 primitive 배열이 기본이다.

### 재귀 깊이

깊은 DFS는 반복문이나 명시적 스택이 더 안전할 때가 많다.

### 자료형 범위

합계, 거리, 경우의 수는 `Long`을 먼저 의심하는 편이 좋다.

### 너무 Kotlin스럽게만 쓰려는 습관

코테에서는 세련된 코드보다 디버깅 쉬운 코드가 더 강하다.

---

## 문제를 읽고 바로 해야 하는 판단

실전에서는 알고리즘을 떠올리기 전에 제한을 보고 후보를 줄이는 습관이 중요하다.

예를 들어 이런 식이다.

- `N <= 20`
  부분집합, 비트마스킹, 백트래킹 가능성 확인
- `N <= 1000`
  `O(N^2)`도 가능할 수 있음
- `N <= 100000`
  보통 `O(N log N)` 이하를 먼저 생각
- 정점 수가 작고 모든 쌍 관계 필요
  Floyd-Warshall 가능성 확인
- 간선 비용이 모두 1
  BFS 우선
- 최소 비용 경로
  Dijkstra 또는 DP 가능성 확인

이 감각이 잡히면 알고리즘을 무작정 떠올리는 시간이 많이 줄어든다.

---

## 지금 기준에서 추천하는 공부 순서

이미 `algo` 폴더에 Java 풀이가 있으니, 가장 좋은 방법은 대표 문제들을 Kotlin으로 다시 쓰는 것이다.

### 1단계. 배열/구현/기본 자료구조

- `BOJ_1927_최소힙`
- `BOJ_1244_스위치켜고끄기`
- `BOJ_21921_블로그`

### 2단계. 그래프 표현과 탐색

- `BOJ_1697_숨바꼭질`
- `BOJ_4179_불!`
- `BOJ_1976_여행가자`

### 3단계. DP

- `BOJ_2579_계단오르기`
- `BOJ_1520_내리막길`
- `BOJ_2253_점프`

### 4단계. 스택/투 포인터/이분 탐색

- `BOJ_17298_오큰수`
- `BOJ_2493_탑`
- `BOJ_2467_용액`
- `BOJ_2110_공유기설치`

### 5단계. 우선순위 큐/그래프 심화/백트래킹

- `BOJ_4485_녹색옷입은애가젤다지`
- `BOJ_1655_가운데를말해요`
- `BOJ_1987_알파벳`
- `BOJ_1941_소문난칠공주`

### 6단계. 추가 확장

`algo` 폴더에 없더라도 반드시 대비할 만한 축은 이것들이다.

- 위상 정렬
- MST
- Floyd-Warshall
- Prefix Sum
- Bitmask
- Trie
- Segment Tree

Trie와 Segment Tree는 지금 바로 깊게 들어가기보다, 기본 유형들을 먼저 안정화한 뒤 확장하는 편이 낫다.

---

## 마무리

Kotlin으로 코테를 준비할 때 중요한 건 언어 자체가 아니라 유형을 다루는 손이다.

- 그래프를 어떤 구조로 저장할지
- DFS/BFS 중 무엇이 맞는지
- 최단 경로인지, 위상 정렬인지, 유니온 파인드인지
- DP 상태를 어떻게 정의할지
- 이분 탐색이 정답 탐색인지
- 백트래킹에서 무엇을 선택하고 복구할지

이 감각이 먼저 잡혀야 한다.

정리하면 이렇게 가져가면 된다.

```text
1. Kotlin 기본 문법은 배열, 반복문, 정렬, StringBuilder 정도만 확실히 익힌다.
2. 그래프는 인접 행렬과 인접 리스트를 모두 구현할 수 있게 만든다.
3. BFS, DFS, Dijkstra, 위상 정렬, 유니온 파인드를 손으로 다시 써본다.
4. DP, 이분 탐색, 스택, 투 포인터, 슬라이딩 윈도우를 대표 문제로 반복한다.
5. 백트래킹은 선택, 재귀, 복구 패턴을 몸에 익힌다.
```

코테에서 중요한 건 Kotlin을 멋지게 쓰는 것이 아니라, Kotlin으로 유형을 빠르게 꺼내는 것이다.
