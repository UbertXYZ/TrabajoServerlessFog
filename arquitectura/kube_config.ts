import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as k8s from "@pulumi/kubernetes";
import { fogCluster } from "../kubernetes/fogcluster";

export const k8sProvider = new k8s.Provider("fogK8s", {
  kubeconfig: pulumi
    .all([fogCluster.endpoint, fogCluster.certificateAuthority, fogCluster.name])
    .apply(([endpoint, ca, name]) =>
      JSON.stringify({
        apiVersion: "v1",
        clusters: [
          {
            cluster: {
              server: endpoint,
              "certificate-authority-data": ca.data,
            },
            name,
          },
        ],
        contexts: [
          {
            context: { cluster: name, user: name },
            name,
          },
        ],
        "current-context": name,
        kind: "Config",
        users: [
          {
            name,
            user: {
              exec: {
                apiVersion: "client.authentication.k8s.io/v1beta1",
                command: "aws",
                args: ["eks", "get-token", "--cluster-name", name],
              },
            },
          },
        ],
      })
    ),
});