function localtunnel {
    lt -s emailrgoblin --port 5000
}

until localtunnel; do
echo "localtunnel server crashed"
sleep 2
done
# https://emailrgoblin.localtunnel.me/api/surveys/webhooks