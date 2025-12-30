import * as k8s from "@pulumi/kubernetes";
import { k8sProvider } from "./kube_config";
import { fogImage } from "./ecr_config";
import { cloudUrl } from "./cloud_config";
const baseContainer = {
  name: "fog",
  image: fogImage.imageName,
  ports: [{ containerPort: 3000 }],
};
export const fog01 = new k8s.apps.v1.Deployment(
  "fog01",
  {
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: "fog01" } },
      template: {
        metadata: { labels: { app: "fog01" } },
        spec: {
          containers: [
            {
              ...baseContainer,
              env: [
                { name: "FOG_ID", value: "01" },
                { name: "CLOUD_URL", value: cloudUrl.functionUrl },
              ],
            },
          ],
        },
      },
    },
  },
  { provider: k8sProvider }
);
export const fog02 = new k8s.apps.v1.Deployment(
  "fog02",
  {
    spec: {
      replicas: 1,
      selector: { matchLabels: { app: "fog02" } },
      template: {
        metadata: { labels: { app: "fog02" } },
        spec: {
          containers: [
            {
              ...baseContainer,
              env: [{ name: "FOG_ID", value: "02" }],
            },
          ],
        },
      },
    },
  },
  { provider: k8sProvider }
);