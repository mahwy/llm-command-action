// This file contains intentional syntax errors for testing

function calculateTotal(items {  // Missing closing parenthesis
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity  // Missing semicolon
  }
  return total;
}  // Missing closing brace

const users = [
  { name: "John", age: 30 },
  { name: "Jane", age: 25 }  // Missing comma
  { name: "Bob", age: 35 }
];

// Missing closing brace in export
export { calculateTotal, users;