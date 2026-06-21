// Curated LeetCode problems mapped to a CF-equivalent rating band so the
// sheet generator can mix them in alongside Codeforces and CodeChef.

import type { PoolProblem } from "./codechef-pool";

export const leetcodePool: PoolProblem[] = [
  // Easy ~ 800-1100
  { code: "two-sum", name: "Two Sum", url: "https://leetcode.com/problems/two-sum/", rating: 900, tags: ["data structures", "hashing"] },
  { code: "valid-parentheses", name: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses/", rating: 900, tags: ["data structures", "strings"] },
  { code: "merge-two-sorted-lists", name: "Merge Two Sorted Lists", url: "https://leetcode.com/problems/merge-two-sorted-lists/", rating: 1000, tags: ["implementation", "data structures"] },
  { code: "best-time-to-buy-and-sell-stock", name: "Best Time to Buy and Sell Stock", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", rating: 1000, tags: ["dp", "greedy"] },
  { code: "valid-palindrome", name: "Valid Palindrome", url: "https://leetcode.com/problems/valid-palindrome/", rating: 900, tags: ["two pointers", "strings"] },
  { code: "invert-binary-tree", name: "Invert Binary Tree", url: "https://leetcode.com/problems/invert-binary-tree/", rating: 1000, tags: ["trees", "dfs and similar"] },
  { code: "maximum-subarray", name: "Maximum Subarray", url: "https://leetcode.com/problems/maximum-subarray/", rating: 1100, tags: ["dp", "greedy"] },
  { code: "climbing-stairs", name: "Climbing Stairs", url: "https://leetcode.com/problems/climbing-stairs/", rating: 900, tags: ["dp"] },
  { code: "linked-list-cycle", name: "Linked List Cycle", url: "https://leetcode.com/problems/linked-list-cycle/", rating: 1000, tags: ["two pointers", "data structures"] },
  { code: "binary-search", name: "Binary Search", url: "https://leetcode.com/problems/binary-search/", rating: 900, tags: ["binary search"] },

  // Medium ~ 1200-1600
  { code: "longest-substring-without-repeating-characters", name: "Longest Substring Without Repeating Characters", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", rating: 1300, tags: ["two pointers", "strings", "hashing"] },
  { code: "3sum", name: "3Sum", url: "https://leetcode.com/problems/3sum/", rating: 1400, tags: ["two pointers", "sortings"] },
  { code: "container-with-most-water", name: "Container With Most Water", url: "https://leetcode.com/problems/container-with-most-water/", rating: 1300, tags: ["two pointers", "greedy"] },
  { code: "group-anagrams", name: "Group Anagrams", url: "https://leetcode.com/problems/group-anagrams/", rating: 1300, tags: ["strings", "hashing"] },
  { code: "product-of-array-except-self", name: "Product of Array Except Self", url: "https://leetcode.com/problems/product-of-array-except-self/", rating: 1400, tags: ["math", "implementation"] },
  { code: "coin-change", name: "Coin Change", url: "https://leetcode.com/problems/coin-change/", rating: 1500, tags: ["dp"] },
  { code: "number-of-islands", name: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands/", rating: 1400, tags: ["graphs", "dfs and similar"] },
  { code: "course-schedule", name: "Course Schedule", url: "https://leetcode.com/problems/course-schedule/", rating: 1500, tags: ["graphs", "dfs and similar"] },
  { code: "validate-binary-search-tree", name: "Validate Binary Search Tree", url: "https://leetcode.com/problems/validate-binary-search-tree/", rating: 1400, tags: ["trees", "dfs and similar"] },
  { code: "lowest-common-ancestor-of-a-binary-tree", name: "Lowest Common Ancestor of a Binary Tree", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", rating: 1500, tags: ["trees", "dfs and similar"] },
  { code: "kth-largest-element-in-an-array", name: "Kth Largest Element in an Array", url: "https://leetcode.com/problems/kth-largest-element-in-an-array/", rating: 1400, tags: ["data structures", "sortings"] },
  { code: "word-break", name: "Word Break", url: "https://leetcode.com/problems/word-break/", rating: 1500, tags: ["dp", "strings"] },
  { code: "longest-palindromic-substring", name: "Longest Palindromic Substring", url: "https://leetcode.com/problems/longest-palindromic-substring/", rating: 1500, tags: ["dp", "strings"] },
  { code: "find-the-duplicate-number", name: "Find the Duplicate Number", url: "https://leetcode.com/problems/find-the-duplicate-number/", rating: 1400, tags: ["two pointers", "binary search"] },
  { code: "subsets", name: "Subsets", url: "https://leetcode.com/problems/subsets/", rating: 1300, tags: ["bitmasks", "dfs and similar"] },
  { code: "rotate-image", name: "Rotate Image", url: "https://leetcode.com/problems/rotate-image/", rating: 1300, tags: ["implementation", "math"] },
  { code: "house-robber", name: "House Robber", url: "https://leetcode.com/problems/house-robber/", rating: 1200, tags: ["dp"] },
  { code: "unique-paths", name: "Unique Paths", url: "https://leetcode.com/problems/unique-paths/", rating: 1200, tags: ["dp", "combinatorics"] },
  { code: "search-in-rotated-sorted-array", name: "Search in Rotated Sorted Array", url: "https://leetcode.com/problems/search-in-rotated-sorted-array/", rating: 1500, tags: ["binary search"] },
  { code: "permutations", name: "Permutations", url: "https://leetcode.com/problems/permutations/", rating: 1300, tags: ["dfs and similar", "combinatorics"] },

  // Hard ~ 1700-2200
  { code: "median-of-two-sorted-arrays", name: "Median of Two Sorted Arrays", url: "https://leetcode.com/problems/median-of-two-sorted-arrays/", rating: 1900, tags: ["binary search"] },
  { code: "trapping-rain-water", name: "Trapping Rain Water", url: "https://leetcode.com/problems/trapping-rain-water/", rating: 1700, tags: ["two pointers", "dp"] },
  { code: "merge-k-sorted-lists", name: "Merge k Sorted Lists", url: "https://leetcode.com/problems/merge-k-sorted-lists/", rating: 1700, tags: ["data structures"] },
  { code: "word-ladder", name: "Word Ladder", url: "https://leetcode.com/problems/word-ladder/", rating: 1800, tags: ["graphs", "dfs and similar"] },
  { code: "edit-distance", name: "Edit Distance", url: "https://leetcode.com/problems/edit-distance/", rating: 1800, tags: ["dp", "strings"] },
  { code: "longest-increasing-path-in-a-matrix", name: "Longest Increasing Path in a Matrix", url: "https://leetcode.com/problems/longest-increasing-path-in-a-matrix/", rating: 1900, tags: ["dp", "dfs and similar"] },
  { code: "regular-expression-matching", name: "Regular Expression Matching", url: "https://leetcode.com/problems/regular-expression-matching/", rating: 1900, tags: ["dp", "strings"] },
  { code: "sliding-window-maximum", name: "Sliding Window Maximum", url: "https://leetcode.com/problems/sliding-window-maximum/", rating: 1800, tags: ["data structures", "two pointers"] },
  { code: "minimum-window-substring", name: "Minimum Window Substring", url: "https://leetcode.com/problems/minimum-window-substring/", rating: 1900, tags: ["two pointers", "strings"] },
  { code: "burst-balloons", name: "Burst Balloons", url: "https://leetcode.com/problems/burst-balloons/", rating: 2100, tags: ["dp"] },
  { code: "shortest-path-in-a-grid-with-obstacles-elimination", name: "Shortest Path in a Grid with Obstacles Elimination", url: "https://leetcode.com/problems/shortest-path-in-a-grid-with-obstacles-elimination/", rating: 1900, tags: ["graphs", "shortest paths"] },
];
