import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { publicSubnetIds, publicSubnetA, publicSubnetB } from "../vpc/fogvpc";

const clusterRole = new aws.iam.Role("eksClusterRole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "eks.amazonaws.com",
    }),
});
new aws.iam.RolePolicyAttachment("eksClusterPolicy", {
    role: clusterRole.name,
    policyArn: aws.iam.ManagedPolicy.AmazonEKSClusterPolicy,
});

export const fogCluster = new aws.eks.Cluster("fogcluster", {
    roleArn: clusterRole.arn,
    vpcConfig: {
        subnetIds: publicSubnetIds,
        endpointPrivateAccess: true,
        endpointPublicAccess: true,
        publicAccessCidrs: ["179.6.165.206/32"],
    },
});
const nodeGroupRole = new aws.iam.Role("fogNodeGroupRole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "ec2.amazonaws.com",
    }),
});
const policies = [
    aws.iam.ManagedPolicy.AmazonEKSWorkerNodePolicy,
    aws.iam.ManagedPolicy.AmazonEC2ContainerRegistryReadOnly,
    aws.iam.ManagedPolicy.AmazonEKS_CNI_Policy,
];

policies.forEach((policy, i) => {
    new aws.iam.RolePolicyAttachment(`nodeGroupPolicy-${i}`, {
        role: nodeGroupRole.name,
        policyArn: policy,
    });
});
export const fogNodeGroup = new aws.eks.NodeGroup("fognodegroup", {
    clusterName: fogCluster.name,
    nodeRoleArn: nodeGroupRole.arn,
    subnetIds: [publicSubnetA.id, publicSubnetB.id],
    scalingConfig: {
        desiredSize: 2,
        minSize: 2,
        maxSize: 3,
    },
    instanceTypes: ["t3.medium"],
});