import * as k8s from "@pulumi/kubernetes";
import { k8sProvider } from "./kube_config";

export const ingress = new k8s.networking.v1.Ingress(
  "fog-ingress",
  {
    metadata: {
      annotations: {
        "kubernetes.io/ingress.class": "alb",
        "alb.ingress.kubernetes.io/scheme": "internal",
        "alb.ingress.kubernetes.io/target-type": "ip",
        "alb.ingress.kubernetes.io/listen-ports": '[{"HTTP":80}]',
      },
    },
    spec: {
      rules: [
        {
          http: {
            paths: [
              {
                path: "/fog01",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: "fog01-svc",
                    port: { number: 80 },
                  },
                },
              },
              {
                path: "/fog02",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: "fog02-svc",
                    port: { number: 80 },
                  },
                },
              },
            ],
          },
        },
      ],
    },
  },
  { provider: k8sProvider }
);