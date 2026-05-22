kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

kubectl create secret generic ai-secret --from-literal=MISTRALAI_API_KEY=


http://sandbox-service-019e513a-7d79-744d-a487-e79ff07aa673:3000
http://019e513a-7d79-744d-a487-e79ff07aa673.preview.localhost/