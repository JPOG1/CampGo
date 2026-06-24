import { create } from 'zustand';
import type { Ride, Delivery } from '../shared/types';

interface RideState {
  activeRides: Ride[];
  rideHistory: Ride[];
  selectedRide: Ride | null;
  activeDeliveries: Delivery[];
  deliveryHistory: Delivery[];
  selectedDelivery: Delivery | null;
  setActiveRides: (rides: Ride[]) => void;
  setRideHistory: (rides: Ride[]) => void;
  setSelectedRide: (ride: Ride | null) => void;
  addRide: (ride: Ride) => void;
  setActiveDeliveries: (deliveries: Delivery[]) => void;
  setDeliveryHistory: (deliveries: Delivery[]) => void;
  setSelectedDelivery: (delivery: Delivery | null) => void;
  addDelivery: (delivery: Delivery) => void;
}

export const useRideStore = create<RideState>((set) => ({
  activeRides: [],
  rideHistory: [],
  selectedRide: null,
  activeDeliveries: [],
  deliveryHistory: [],
  selectedDelivery: null,

  setActiveRides: (rides) => set({ activeRides: rides }),
  setRideHistory: (rides) => set({ rideHistory: rides }),
  setSelectedRide: (ride) => set({ selectedRide: ride }),
  addRide: (ride) => set((s) => ({ activeRides: [ride, ...s.activeRides] })),

  setActiveDeliveries: (deliveries) => set({ activeDeliveries: deliveries }),
  setDeliveryHistory: (deliveries) => set({ deliveryHistory: deliveries }),
  setSelectedDelivery: (delivery) => set({ selectedDelivery: delivery }),
  addDelivery: (delivery) => set((s) => ({ activeDeliveries: [delivery, ...s.activeDeliveries] })),
}));
