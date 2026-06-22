// Curated CodeChef practice problems. Each entry maps to a difficulty band
// roughly aligned with Codeforces ratings so the sheet generator can pick from
// a shared difficulty scale across platforms.

export interface PoolProblem {
  code: string; // unique key per platform
  name: string;
  url: string;
  rating: number; // normalized CF-equivalent
  tags: string[];
}

export const codechefPool: PoolProblem[] = [
  // Beginner 800-1000
  {
    code: "FLOW001",
    name: "Add Two Numbers",
    url: "https://www.codechef.com/problems/FLOW001",
    rating: 800,
    tags: ["implementation", "math"],
  },
  {
    code: "FLOW007",
    name: "Reverse The Number",
    url: "https://www.codechef.com/problems/FLOW007",
    rating: 800,
    tags: ["implementation"],
  },
  {
    code: "INTEST",
    name: "Enormous Input Test",
    url: "https://www.codechef.com/problems/INTEST",
    rating: 800,
    tags: ["implementation"],
  },
  {
    code: "FCTRL2",
    name: "Small Factorials",
    url: "https://www.codechef.com/problems/FCTRL2",
    rating: 900,
    tags: ["math", "implementation"],
  },
  {
    code: "LAPIN",
    name: "Lapindromes",
    url: "https://www.codechef.com/problems/LAPIN",
    rating: 900,
    tags: ["strings"],
  },
  {
    code: "HORSES",
    name: "Racing Horses",
    url: "https://www.codechef.com/problems/HORSES",
    rating: 1000,
    tags: ["sortings", "greedy"],
  },
  {
    code: "AMR15A",
    name: "Chef and Lottery",
    url: "https://www.codechef.com/problems/AMR15A",
    rating: 900,
    tags: ["implementation"],
  },
  {
    code: "MUFFINS3",
    name: "Cutting Muffins",
    url: "https://www.codechef.com/problems/MUFFINS3",
    rating: 1000,
    tags: ["binary search", "greedy"],
  },

  // Pupil 1100-1300
  {
    code: "CIELRCPT",
    name: "Ciel and Receipt",
    url: "https://www.codechef.com/problems/CIELRCPT",
    rating: 1100,
    tags: ["greedy", "sortings"],
  },
  {
    code: "CHEFSTLT",
    name: "Chef and Stalls",
    url: "https://www.codechef.com/problems/CHEFSTLT",
    rating: 1100,
    tags: ["greedy"],
  },
  {
    code: "FRGTNLNG",
    name: "Forgotten Language",
    url: "https://www.codechef.com/problems/FRGTNLNG",
    rating: 1100,
    tags: ["strings", "implementation"],
  },
  {
    code: "DEVUSGN",
    name: "Devu and his Class",
    url: "https://www.codechef.com/problems/DEVUSGN",
    rating: 1100,
    tags: ["math"],
  },
  {
    code: "ANUMLA",
    name: "Anuumla",
    url: "https://www.codechef.com/problems/ANUMLA",
    rating: 1200,
    tags: ["greedy", "constructive algorithms"],
  },
  {
    code: "MARCAPS",
    name: "Captain Marvel",
    url: "https://www.codechef.com/problems/MARCAPS",
    rating: 1200,
    tags: ["math", "binary search"],
  },
  {
    code: "LADDU",
    name: "Laddu",
    url: "https://www.codechef.com/problems/LADDU",
    rating: 1200,
    tags: ["implementation"],
  },
  {
    code: "CHFING",
    name: "Chef and Ingredients",
    url: "https://www.codechef.com/problems/CHFING",
    rating: 1300,
    tags: ["math", "number theory"],
  },
  {
    code: "MAXEP",
    name: "Maximum Production",
    url: "https://www.codechef.com/problems/MAXEP",
    rating: 1300,
    tags: ["binary search"],
  },
  {
    code: "BUYING2",
    name: "Buying Sweets",
    url: "https://www.codechef.com/problems/BUYING2",
    rating: 1300,
    tags: ["greedy", "math"],
  },

  // Specialist 1400-1600
  {
    code: "PERMUTE",
    name: "Permutation Game",
    url: "https://www.codechef.com/problems/PERMUTE",
    rating: 1400,
    tags: ["constructive algorithms"],
  },
  {
    code: "CHEFPRMS",
    name: "Chef and Prime Divisors",
    url: "https://www.codechef.com/problems/CHEFPRMS",
    rating: 1400,
    tags: ["number theory", "math"],
  },
  {
    code: "MGCHGEOM",
    name: "Magic Geometry",
    url: "https://www.codechef.com/problems/MGCHGEOM",
    rating: 1500,
    tags: ["geometry"],
  },
  {
    code: "STRTSTR",
    name: "Starters Strings",
    url: "https://www.codechef.com/problems/STRTSTR",
    rating: 1500,
    tags: ["strings", "two pointers"],
  },
  {
    code: "FIRESC",
    name: "Fire Escape Routes",
    url: "https://www.codechef.com/problems/FIRESC",
    rating: 1500,
    tags: ["dsu", "graphs"],
  },
  {
    code: "GRAPHCNT",
    name: "Graph Counting",
    url: "https://www.codechef.com/problems/GRAPHCNT",
    rating: 1500,
    tags: ["graphs", "dfs and similar"],
  },
  {
    code: "SUMTRIAN",
    name: "Sums in a Triangle",
    url: "https://www.codechef.com/problems/SUMTRIAN",
    rating: 1500,
    tags: ["dp"],
  },
  {
    code: "TWOVSTEN",
    name: "Two vs Ten",
    url: "https://www.codechef.com/problems/TWOVSTEN",
    rating: 1500,
    tags: ["greedy"],
  },
  {
    code: "MEX1",
    name: "MEX 1",
    url: "https://www.codechef.com/problems/MEX1",
    rating: 1600,
    tags: ["constructive algorithms", "greedy"],
  },
  {
    code: "PRPALIN",
    name: "Prime Palindromes",
    url: "https://www.codechef.com/problems/PRPALIN",
    rating: 1600,
    tags: ["number theory"],
  },

  // Expert 1700-1900
  {
    code: "KCON",
    name: "K-Concatenation",
    url: "https://www.codechef.com/problems/KCON",
    rating: 1700,
    tags: ["dp"],
  },
  {
    code: "CHEFPATH",
    name: "Chef and Path",
    url: "https://www.codechef.com/problems/CHEFPATH",
    rating: 1700,
    tags: ["graphs", "constructive algorithms"],
  },
  {
    code: "GERALD2",
    name: "Gerald and Path",
    url: "https://www.codechef.com/problems/GERALD2",
    rating: 1800,
    tags: ["dp"],
  },
  {
    code: "SEABUS",
    name: "Sereja and Bus",
    url: "https://www.codechef.com/problems/SEABUS",
    rating: 1700,
    tags: ["data structures", "graphs"],
  },
  {
    code: "TREECNT2",
    name: "Tree Count",
    url: "https://www.codechef.com/problems/TREECNT2",
    rating: 1800,
    tags: ["trees", "dp"],
  },
  {
    code: "RRTREE",
    name: "Rooted Tree",
    url: "https://www.codechef.com/problems/RRTREE",
    rating: 1800,
    tags: ["trees", "dfs and similar"],
  },
  {
    code: "TWOFL",
    name: "Two Flowers",
    url: "https://www.codechef.com/problems/TWOFL",
    rating: 1900,
    tags: ["dsu", "sortings"],
  },

  // Candidate Master+ 2000+
  {
    code: "TREEPATHS",
    name: "Tree Paths",
    url: "https://www.codechef.com/problems/TREEPATHS",
    rating: 2000,
    tags: ["trees", "dp"],
  },
  {
    code: "SEGSUMQ",
    name: "Segment Sum Queries",
    url: "https://www.codechef.com/problems/SEGSUMQ",
    rating: 2100,
    tags: ["data structures"],
  },
  {
    code: "BINOP",
    name: "Binary Operations",
    url: "https://www.codechef.com/problems/BINOP",
    rating: 2100,
    tags: ["bitmasks", "dp"],
  },
];
