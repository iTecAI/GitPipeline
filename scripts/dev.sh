cd client
yarn install

cd ../api
python3 -m venv venv
chmod +x ./venv/bin/activate
source ./venv/bin/activate
python3 -m pip install -r requirements.txt
deactivate