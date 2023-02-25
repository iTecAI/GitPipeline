cd api
source venv/bin/activate
python -m uvicorn main:app --reload --host=localhost --port=8000 --log-level=info --no-access-log