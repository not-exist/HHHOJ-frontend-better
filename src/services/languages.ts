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
