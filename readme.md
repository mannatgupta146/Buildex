kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

kubectl create secret generic ai-secret --from-literal=MISTRALAI_API_KEY=


http:/sandbox-service-019e5f18-dd20-774a-993f-ef654917cefe:3000

http://019e5f18-dd20-774a-993f-ef654917cefe.preview.localhost/