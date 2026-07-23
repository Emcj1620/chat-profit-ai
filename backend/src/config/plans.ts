export interface Plan {
  id: number;
  name: string;
  price: number;
  maxUsers: number;
  maxConnections: number;
}

export const plans: Plan[] = [
  {
    id: 1,
    name: "Bronze",
    price: 49.90,
    maxUsers: 3,
    maxConnections: 1
  },
  {
    id: 2,
    name: "Prata",
    price: 99.90,
    maxUsers: 10,
    maxConnections: 3
  },
  {
    id: 3,
    name: "Ouro",
    price: 199.90,
    maxUsers: -1, // Unlimited
    maxConnections: -1 // Unlimited
  }
];

export function getPlanById(id: number): Plan | undefined {
  return plans.find(p => p.id === id);
}
