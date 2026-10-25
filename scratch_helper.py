import os
import sqlite3
import json
import csv
import shutil
import random

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "sandbox_workspace"))

FIRST_NAMES = [
    "Aarav", "Aditi", "Akash", "Ananya", "Aniket", "Devendra", "Ishita", "Karan", 
    "Meera", "Nikhil", "Pooja", "Pranav", "Priya", "Rahul", "Riya", "Rohan", 
    "Sakshi", "Sameer", "Siddharth", "Sneha", "Tanvi", "Varun", "Vikram", "Yash",
    "Aditya", "Amrita", "Aryan", "Bhavna", "Chirag", "Deepika", "Gaurav", "Harsh",
    "Isha", "Jatin", "Kavita", "Manish", "Neha", "Omkar", "Payal", "Rajesh",
    "Shruti", "Suresh", "Tanya", "Utkarsh", "Vaishnavi", "Vivek", "Zoya", "Arjun",
    "Kavya", "Mohit", "Nandini", "Parth", "Rachit", "Shreya", "Tarun", "Vipul"
]

LAST_NAMES = [
    "Sharma", "Verma", "Nair", "Roy", "Patil", "Joshi", "Sen", "Malhotra", 
    "Iyer", "Kulkarni", "Deshmukh", "Chopra", "Gupta", "Mehta", "Bhat", "Rao",
    "Reddy", "Mishra", "Pandey", "Saxena", "Bose", "Banerjee", "Chatterjee", "Singh",
    "Kapoor", "Agarwal", "Bhattacharya", "Chauhan", "Ghosh", "Jadhav", "Kale", "Kaur",
    "Mahajan", "Mukherjee", "Naik", "Pillai", "Prasad", "Sethi", "Shukla", "Thakur"
]

CITIES = ["Pune", "Mumbai", "Bangalore", "Hyderabad", "Delhi", "Nagpur", "Nashik", "Ahmedabad", "Indore", "Jaipur", "Kolkata", "Chennai"]
BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]

def get_student_list(n=100):
    random.seed(42)
    students = []
    for i in range(1, n + 1):
        fn = FIRST_NAMES[(i - 1) % len(FIRST_NAMES)]
        ln = LAST_NAMES[(i * 3) % len(LAST_NAMES)]
        prn = f"22070123{i:03d}"
        roll = f"CS-{i:03d}"
        email = f"{fn.lower()}.{ln.lower()}@sitpune.edu.in"
        guardian = f"{random.choice(FIRST_NAMES)} {ln}"
        contact = f"+91 98{random.randint(10000000, 99999999)}"
        guardian_contact = f"+91 97{random.randint(10000000, 99999999)}"
        bg = random.choice(BLOOD_GROUPS)
        city = random.choice(CITIES)
        students.append({
            "prn": prn,
            "roll": roll,
            "name": f"{fn} {ln}",
            "email": email,
            "guardian": guardian,
            "contact": contact,
            "guardian_contact": guardian_contact,
            "blood_group": bg,
            "city": city,
            "section": "A" if i <= n // 2 else "B"
        })
    return students

def generate_csv_rows(students, marks_type="sem7"):
    random.seed(100 + len(students))
    rows = []
    for s in students:
        att = round(random.uniform(62.0, 98.0), 1)
        m1 = round(random.uniform(18.0, 30.0), 1)
        m2 = round(random.uniform(19.0, 30.0), 1)
        end_sem = round(random.uniform(40.0, 60.0), 1)
        viva = round(random.uniform(14.0, 20.0), 1)
        internal = round(random.uniform(15.0, 20.0), 1)
        total = round(m1 * 0.5 + m2 * 0.5 + end_sem + viva + internal, 1)
        
        # Grading
        if total >= 90:
            grade, sgpa = "O", 10.0
        elif total >= 80:
            grade, sgpa = "A+", 9.0
        elif total >= 70:
            grade, sgpa = "A", 8.0
        elif total >= 60:
            grade, sgpa = "B+", 7.0
        elif total >= 50:
            grade, sgpa = "B", 6.0
        elif total >= 40:
            grade, sgpa = "C", 5.0
        else:
            grade, sgpa = "F", 0.0

        backlogs = 0 if grade != "F" else 1
        rows.append({
            "prn": s["prn"],
            "roll": s["roll"],
            "name": s["name"],
            "attendance": att,
            "midsem1": m1,
            "midsem2": m2,
            "endsem": end_sem,
            "viva": viva,
            "internal": internal,
            "total": total,
            "grade": grade,
            "sgpa": sgpa,
            "backlogs": backlogs
        })
    return rows

print("Helper functions defined successfully")
