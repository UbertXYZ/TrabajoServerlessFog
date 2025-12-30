import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { publicSubnetA, publicSubnetB } from "../vpc/fogvpc";
import { k8sProvider } from "./kube_config";
import "./workers_config";
export const fog01Service = new k8s.core.v1.Service(
  "fog01-svc",
  {
    metadata: {
      name: "fog01-svc",
      annotations: {
        "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
        "service.beta.kubernetes.io/aws-load-balancer-internal": "false",
        "service.beta.kubernetes.io/aws-load-balancer-subnets": pulumi.interpolate`${publicSubnetA.id},${publicSubnetB.id}`,
      },
    },
    spec: {
      type: "LoadBalancer",
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
      name: "fog02-svc",
      annotations: {
        "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
        "service.beta.kubernetes.io/aws-load-balancer-internal": "false",
        "service.beta.kubernetes.io/aws-load-balancer-subnets": pulumi.interpolate`${publicSubnetA.id},${publicSubnetB.id}`,
      },
    },
    spec: {
      type: "LoadBalancer",
      selector: { app: "fog02" },
      ports: [{ port: 80, targetPort: 3000 }],
    },
  },
  { provider: k8sProvider }
);