import * as k8s from "@pulumi/kubernetes";
import { k8sProvider } from "./kube_config";
import { fog01, fog02 }from "./workers_config";

export const fog01Service = new k8s.core.v1.Service(
  "fog01-svc",
  {
    metadata: {
      annotations: {
        "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
        "service.beta.kubernetes.io/aws-load-balancer-internal": "true",
      },
    },
    spec: {
      type: "ClusterIP",
      selector: { app: "fog01" },
      ports: [{ port: 80, targetPort: 3000 }],
    },
  },
  { provider: k8sProvider }
);

export const fog02Service = new k8s.core.v1.Service(
  "fog02-svc",
  {
    metadata: {
      annotations: {
        "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
        "service.beta.kubernetes.io/aws-load-balancer-internal": "true",
      },
    },
    spec: {
      type: "ClusterIP",
      selector: { app: "fog02" },
      ports: [{ port: 80, targetPort: 3000 }],
    },
  },
  { provider: k8sProvider }
);