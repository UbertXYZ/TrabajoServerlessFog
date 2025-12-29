import * as aws from "@pulumi/aws";
import { subnetIds } from "../vpc/fogvpc";

const clusterRole = new aws.iam.Role("eksClusterRole", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "eks.amazonaws.com",
  }),
});

new aws.iam.RolePolicyAttachment("eksClusterPolicy", {
  role: clusterRole.name,
  policyArn: aws.iam.ManagedPolicy.AmazonEKSClusterPolicy,
});

export const fogCluster = new aws.eks.Cluster("fogCluster", {
  roleArn: clusterRole.arn,
  vpcConfig: {
    subnetIds,
    endpointPrivateAccess: true,
    endpointPublicAccess: true,
    publicAccessCidrs: ["179.6.165.206/32"],
  },
});

const podRole = new aws.iam.Role("eksFargatePodRole", {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: "eks-fargate-pods.amazonaws.com",
  }),
});
new aws.iam.RolePolicyAttachment("fargateEcr", {
  role: podRole.name,
  policyArn: aws.iam.ManagedPolicy.AmazonEC2ContainerRegistryReadOnly,
});
[
  aws.iam.ManagedPolicy.AmazonEKSFargatePodExecutionRolePolicy,
].forEach((p, i) =>
  new aws.iam.RolePolicyAttachment(`podPol-${i}`, {
    role: podRole.name,
    policyArn: p,
  })
);
new aws.eks.FargateProfile("kubeSystemFargate", {
  clusterName: fogCluster.name,
  podExecutionRoleArn: podRole.arn,
  subnetIds,
  selectors: [
    {
      namespace: "kube-system",
    },
  ],
});