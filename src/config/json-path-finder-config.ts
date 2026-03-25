export interface JsonPathFinderOptions {
  returnPaths: boolean;
  returnValues: boolean;
  formatOutput: boolean;
  sortKeys: 'none' | 'asc' | 'desc';
}

export const DEFAULT_JSON_PATH_OPTIONS: JsonPathFinderOptions = {
  returnPaths: true,
  returnValues: true,
  formatOutput: true,
  sortKeys: 'none',
};

export const JSON_PATH_SORT_OPTIONS = [
  { value: 'none', label: 'Keep original order' },
  { value: 'asc',  label: 'Ascending (A-Z)' },
  { value: 'desc', label: 'Descending (Z-A)' },
] as const;

export const JSON_PATH_EXAMPLES = [
  {
    name: 'Simple Object',
    json: `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com"
}`,
    path: '$.name',
    description: 'Access a simple property'
  },
  {
    name: 'Nested Object',
    json: `{
  "user": {
    "id": 1,
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "zipCode": "10001"
      }
    }
  }
}`,
    path: '$.user.profile.address.city',
    description: 'Navigate nested properties'
  },
  {
    name: 'Array Access',
    json: `{
  "users": [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
    {"id": 3, "name": "Charlie"}
  ]
}`,
    path: '$.users[0].name',
    description: 'Access first array element'
  },
  {
    name: 'Array Wildcard',
    json: `{
  "products": [
    {"id": 1, "name": "Product A", "price": 29.99},
    {"id": 2, "name": "Product B", "price": 39.99},
    {"id": 3, "name": "Product C", "price": 49.99}
  ]
}`,
    path: '$.products[*].name',
    description: 'Get all product names'
  },
  {
    name: 'Recursive Descent',
    json: `{
  "store": {
    "book": [
      {"title": "Book 1", "author": "Author A"},
      {"title": "Book 2", "author": "Author B"}
    ],
    "bicycle": {
      "color": "red",
      "price": 19.95
    }
  }
}`,
    path: '$..title',
    description: 'Find all titles recursively'
  },
  {
    name: 'Array Slice',
    json: `{
  "items": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}`,
    path: '$.items[1:4]',
    description: 'Get array slice (indices 1-3)'
  },
  {
    name: 'Root Array',
    json: `[1, 2, 3, 4, 5]`,
    path: '$[0]',
    description: 'Access root array element'
  },
  {
    name: 'Root Array Wildcard',
    json: `[
  {"id": 1, "name": "Item 1"},
  {"id": 2, "name": "Item 2"},
  {"id": 3, "name": "Item 3"}
]`,
    path: '$[*].name',
    description: 'Get all names from root array'
  },
  {
    name: 'All Properties',
    json: `{
  "user": {
    "name": "John",
    "age": 30,
    "email": "john@example.com"
  }
}`,
    path: '$.user.*',
    description: 'Get all user properties'
  },
  {
    name: 'API Response',
    json: `{
  "status": "success",
  "data": {
    "users": [
      {"id": 1, "name": "Alice", "role": "admin"},
      {"id": 2, "name": "Bob", "role": "user"}
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2
    }
  }
}`,
    path: '$..role',
    description: 'Find all roles in the structure'
  }
];

export const JSON_PATH_COMMON_PATTERNS = [
  {
    pattern: '$.property',
    description: 'Access root property',
    example: '$.name'
  },
  {
    pattern: '$.parent.child',
    description: 'Access nested property',
    example: '$.user.profile.name'
  },
  {
    pattern: '$.array[0]',
    description: 'Access array element by index',
    example: '$.items[0]'
  },
  {
    pattern: '$.array[*]',
    description: 'Access all array elements',
    example: '$.users[*]'
  },
  {
    pattern: '$.array[1:4]',
    description: 'Array slice (start:end)',
    example: '$.items[1:4]'
  },
  {
    pattern: '$..property',
    description: 'Recursive descent - find all properties',
    example: '$..name'
  },
  {
    pattern: '$.*',
    description: 'All root properties',
    example: '$.*'
  },
  {
    pattern: '$["property"]',
    description: 'Bracket notation for property',
    example: '$["user-name"]'
  }
];

export const JSON_PATH_TIPS = [
  {
    tip: 'Root Selector',
    description: 'Always start with $ to reference the root of the JSON document',
    example: '$.property'
  },
  {
    tip: 'Dot Notation',
    description: 'Use dots to navigate nested objects',
    example: '$.user.profile.name'
  },
  {
    tip: 'Bracket Notation',
    description: 'Use brackets for array indices or property names with special characters',
    example: '$.items[0] or $["property-name"]'
  },
  {
    tip: 'Wildcard',
    description: 'Use * to match all elements at a level',
    example: '$.users[*].name'
  },
  {
    tip: 'Recursive Descent',
    description: 'Use .. to search recursively through all levels',
    example: '$..email (finds all email properties)'
  },
  {
    tip: 'Array Slicing',
    description: 'Use [start:end] to get a range of array elements',
    example: '$.items[1:4] (gets indices 1, 2, 3)'
  }
];

export const JSON_PATH_FINDER_DESCRIPTIONS = {
  title: 'JSON Path Finder',
  description: 'Query and extract data from JSON using JSONPath expressions',
  features: [
    'Evaluate JSONPath expressions against JSON data',
    'Find and extract matching values',
    'Display paths to matched elements',
    'Support for common JSONPath syntax',
    'Real-time query validation'
  ],
  useCases: [
    'Extract specific data from API responses',
    'Navigate complex JSON structures',
    'Find all occurrences of a property',
    'Query nested objects and arrays',
    'Data transformation and filtering'
  ]
};

