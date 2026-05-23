kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

kubectl create secret generic ai-secret --from-literal=MISTRALAI_API_KEY=


http:/sandbox-service-019e551e-5b2d-7368-b5df-0d232ed9fefd:3000

http://019e551e-5b2d-7368-b5df-0d232ed9fefd.preview.localhost/