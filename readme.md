kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

kubectl create secret generic ai-secret --from-literal=MISTRALAI_API_KEY=


http://sandbox-service-019e2739-bc90-7502-aafc-23850483cdbe:3000/list-files