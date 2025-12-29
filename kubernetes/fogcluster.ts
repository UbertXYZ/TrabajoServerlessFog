import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as fs from "fs";
import * as path from "path";
import { privateSubnetA, privateSubnetB, privateSubnetIds } from "../vpc/fogvpc";

/* =========================
   EKS CLUSTER ROLE
========================= */
const clusterRole = new aws.iam.Role("eksClusterRole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "eks.amazonaws.com",
    }),
});

new aws.iam.RolePolicyAttachment("eksClusterPolicy", {
    role: clusterRole.name,
    policyArn: aws.iam.ManagedPolicy.AmazonEKSClusterPolicy,
});

/* =========================
   EKS CLUSTER
========================= */
export const fogCluster = new aws.eks.Cluster("fogCluster", {
    roleArn: clusterRole.arn,
    vpcConfig: {
        subnetIds: privateSubnetIds,
        endpointPrivateAccess: true,
        endpointPublicAccess: true,
        publicAccessCidrs: ["45.231.83.2/32"],
    },
});

/* =========================
   OIDC PROVIDER (IRSA)
========================= */
const oidcProvider = new aws.iam.OpenIdConnectProvider("eksOidcProvider", {
    url: fogCluster.identities.apply(ids => ids[0].oidcs![0].issuer),
    clientIdLists: ["sts.amazonaws.com"],
    thumbprintLists: ["9e99a48a9960b14926bb7f3b02e22da0afd40a2c"], // AWS root CA
});

/* =========================
   ALB CONTROLLER ROLE (IRSA)
========================= */
export const albControllerRole = new aws.iam.Role("albControllerRole", {
    assumeRolePolicy: pulumi
        .all([oidcProvider.arn, oidcProvider.url])
        .apply(([arn, url]) =>
            JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: { Federated: arn },
                        Action: "sts:AssumeRoleWithWebIdentity",
                        Condition: {
                            StringEquals: {
                                [`${url.replace("https://", "")}:sub`]:
                                    "system:serviceaccount:kube-system:aws-load-balancer-controller",
                            },
                        },
                    },
                ],
            })
        ),
});

const albPolicy = new aws.iam.Policy("albControllerIamPolicy", {
    policy: fs.readFileSync(
        path.join(__dirname, "alb-controller-policy.json"),
        "utf8"
    ),
});

new aws.iam.RolePolicyAttachment("albControllerPolicyAttach", {
    role: albControllerRole.name,
    policyArn: albPolicy.arn,
});

/* =========================
   FARGATE POD ROLE
========================= */
const podRole = new aws.iam.Role("eksFargatePodRole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "eks-fargate-pods.amazonaws.com",
    }),
});

new aws.iam.RolePolicyAttachment("fargateEcr", {
    role: podRole.name,
    policyArn: aws.iam.ManagedPolicy.AmazonEC2ContainerRegistryReadOnly,
});

new aws.iam.RolePolicyAttachment("fargateExecution", {
    role: podRole.name,
    policyArn:
        aws.iam.ManagedPolicy.AmazonEKSFargatePodExecutionRolePolicy,
});

/* =========================
   FARGATE PROFILE
========================= */
new aws.eks.FargateProfile("kubeSystemFargate", {
    clusterName: fogCluster.name,
    podExecutionRoleArn: podRole.arn,
    subnetIds: [privateSubnetA.id, privateSubnetB.id],
    selectors: [{ namespace: "kube-system" }],
});