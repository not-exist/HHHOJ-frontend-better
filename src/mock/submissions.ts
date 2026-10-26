import type { Submission, Verdict, TestcaseResult } from '@/types'
import { USERS } from './users'
import { PROBLEMS } from './problems'

export const LANGUAGES = ['C++20', 'C++17', 'C', 'Java', 'Python 3', 'Rust'] as const
export type Language = (typeof LANGUAGES)[number]

/** 各语言的示例代码模板 */
export const CODE_TEMPLATES: Record<string, string> = {
  'C++20': `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`,
  'C++17': `#include <bits/stdc++.h>
using namespace std;

int main() {
    // your code here

    return 0;
}
`,
  C: `#include <stdio.h>

int main(void) {

    return 0;
}
`,
  Java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);

    }
}
`,
  'Python 3': `import sys

def main():
    pass

if __name__ == "__main__":
    main()
`,
  Rust: `use std::io;

fn main() {

}
`,
}

/** 确定性伪随机（可复现的 mock） */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FINAL_VERDICTS: Verdict[] = [
  'Accepted', 'Accepted', 'Accepted', 'Accepted', 'Accepted', 'Accepted',
  'WrongAnswer', 'WrongAnswer', 'WrongAnswer', 'WrongAnswer',
  'TimeLimitExceeded', 'TimeLimitExceeded',
  'RuntimeError', 'MemoryLimitExceeded', 'CompileError',
]

export function randomFinalVerdict(rnd: () => number): Verdict {
  return FINAL_VERDICTS[Math.floor(rnd() * FINAL_VERDICTS.length)]
}

export function makeTestcases(verdict: Verdict, count: number, rnd: () => number): TestcaseResult[] {
  const out: TestcaseResult[] = []
  for (let i = 0; i < count; i++) {
    out.push({
      index: i + 1,
      verdict,
      timeMs: Math.round(5 + rnd() * 400),
      memoryMb: Math.round(2 + rnd() * 60),
      score: verdict === 'Accepted' ? 100 : Math.max(0, Math.round(60 - i * 8 + rnd() * 10)),
    })
  }
  return out
}

let nextSubId = 1

export function buildInitialSubmissions(): Submission[] {
  const rnd = mulberry32(20261025)
  const subs: Submission[] = []
  nextSubId = 1
  const now = Date.now()
  for (let i = 0; i < 160; i++) {
    const problem = PROBLEMS[Math.floor(rnd() * PROBLEMS.length)]
    const user = USERS[Math.floor(rnd() * USERS.length)]
    const language = LANGUAGES[Math.floor(rnd() * LANGUAGES.length)]
    const verdict = randomFinalVerdict(rnd)
    const ageMs = Math.round(rnd() * 3 * 24 * 3600_000)
    const testcaseCount = 3 + Math.floor(rnd() * 8)
    subs.push({
      id: nextSubId++,
      problemId: problem.id,
      userName: user.name,
      language,
      code: CODE_TEMPLATES[language] ?? CODE_TEMPLATES['C++20'],
      verdict,
      timeMs: verdict === 'CompileError' || verdict === 'Accepted' && rnd() < 0.2 ? Math.round(3 + rnd() * 15) : Math.round(20 + rnd() * (problem.timeLimitMs * (verdict === 'TimeLimitExceeded' ? 1.3 : 0.9))),
      memoryMb: verdict === 'CompileError' ? null : Math.round(3 + rnd() * (verdict === 'MemoryLimitExceeded' ? problem.memoryLimitMb * 1.2 : problem.memoryLimitMb * 0.8)),
      codeSizeKb: Math.round((0.4 + rnd() * 4) * 10) / 10,
      submittedAt: now - ageMs,
      testcases: verdict === 'CompileError' ? [] : makeTestcases(verdict, verdict === 'Accepted' ? testcaseCount : 1 + Math.floor(rnd() * testcaseCount), rnd),
      score: verdict === 'Accepted' ? 100 : verdict === 'CompileError' ? 0 : Math.round(rnd() * 70),
    })
  }
  // 让列表顶部固定是最近提交
  subs.sort((a, b) => b.submittedAt - a.submittedAt)
  return subs
}

export function peekNextSubmissionId(): number {
  return nextSubId
}

export function advanceSubmissionId(): number {
  return nextSubId++
}
