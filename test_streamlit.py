import streamlit as st
import requests

st.title("DiatomAI Test")
st.write("Testing Streamlit and Flask connection...")

FLASK_URL = "http://localhost:5000"

try:
    st.write("Attempting to reach Flask...")
    resp = requests.get(f"{FLASK_URL}/health", timeout=3)
    st.success(f"Flask is running: {resp.json()}")
except Exception as e:
    st.error(f"Flask not reachable: {e}")

st.write("---")
st.write("This is a test page. If you see this, Streamlit is working.")
