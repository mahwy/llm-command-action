# Python file with various syntax issues

def calculate_sum(numbers):
    total = 0
    for num in numbers
        total += num  # Missing colon on for loop
    return total

class User:
    def __init__(self, name, email)  # Missing colon
        self.name = name
        self.email = email
        
    def get_info(self):
        return f"User: {self.name} ({self.email}"  # Missing closing brace

# Incorrect indentation
def process_data(data):
result = []
    for item in data:
        if item > 0:
    result.append(item * 2)  # Wrong indentation
return result  # Wrong indentation