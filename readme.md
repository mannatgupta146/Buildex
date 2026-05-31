kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml

kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s

kubectl create secret generic ai-secret --from-literal=MISTRALAI_API_KEY=


http:/sandbox-service-019e5f18-dd20-774a-993f-ef654917cefe:3000

http://019e5f18-dd20-774a-993f-ef654917cefe.preview.localhost/

kubectl exec -it sandbox-pod-019e63e8-2031-7348-9c48-de558538594f -c agent-container -- cat ./src/app.js

kubectl logs sandbox-pod-019e63e8-2031-7348-9c48-de558538594f -c agent-container

kubectl logs sandbox-pod-019e63e8-2031-7348-9c48-de558538594f -c sandbox-container

