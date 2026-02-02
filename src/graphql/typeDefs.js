import gql from "graphql-tag";

export const typeDefs = gql`
  enum Role { admin employee }
  enum ShipmentStatus { CREATED IN_TRANSIT DELIVERED ON_HOLD }
  enum SortOrder { asc desc }

  type User {
    id: ID!
    name: String!
    email: String!
    role: Role!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Shipment {
    id: ID!
    shipperName: String!
    carrierName: String!
    pickupLocation: String!
    deliveryLocation: String!
    pickupDate: String!
    deliveryDate: String!
    status: ShipmentStatus!
    rateUsd: Float!
    trackingNumber: String!
    reference: String
    weightKg: Float
    notes: String
    createdAt: String!
    updatedAt: String!
  }

  input ShipmentFilter {
    q: String
    status: ShipmentStatus
    shipperName: String
    carrierName: String
    pickupLocation: String
    deliveryLocation: String
  }

  input PaginationInput {
    limit: Int = 10
    offset: Int = 0
  }

  input ShipmentSort {
    sortBy: String = "deliveryDate"
    order: SortOrder = desc
  }

  type ShipmentConnection {
    nodes: [Shipment!]!
    totalCount: Int!
    limit: Int!
    offset: Int!
  }

  input AddShipmentInput {
    shipperName: String!
    carrierName: String!
    pickupLocation: String!
    deliveryLocation: String!
    pickupDate: String!
    deliveryDate: String!
    status: ShipmentStatus!
    rateUsd: Float!
    trackingNumber: String!
    reference: String
    weightKg: Float
    notes: String
  }

  input UpdateShipmentInput {
    shipperName: String
    carrierName: String
    pickupLocation: String
    deliveryLocation: String
    pickupDate: String
    deliveryDate: String
    status: ShipmentStatus
    rateUsd: Float
    reference: String
    weightKg: Float
    notes: String
  }

  type Query {
    me: User
    shipment(id: ID!): Shipment
    shipments(
      filter: ShipmentFilter
      pagination: PaginationInput
      sort: ShipmentSort
    ): ShipmentConnection!
  }

  type Mutation {
    register(name: String!, email: String!, password: String!, role: Role = employee): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    addShipment(input: AddShipmentInput!): Shipment!
    updateShipment(id: ID!, input: UpdateShipmentInput!): Shipment!
    deleteShipment(id: ID!): Boolean!
  }
`;
