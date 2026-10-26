/** HHHOJ 判题机实际支持的语言（server/include/problem/problem.hpp） */
export const LANGUAGES = ['C++17', 'C++14', 'C++11', 'C++', 'C'] as const
export type Language = (typeof LANGUAGES)[number]

const CPP_TEMPLATE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`

const C_TEMPLATE = `#include <stdio.h>

int main(void) {

    return 0;
}
`

/** 各语言的示例代码模板 */
export const CODE_TEMPLATES: Record<string, string> = {
  'C++17': CPP_TEMPLATE,
  'C++14': CPP_TEMPLATE,
  'C++11': CPP_TEMPLATE,
  'C++': CPP_TEMPLATE,
  C: C_TEMPLATE,
}
