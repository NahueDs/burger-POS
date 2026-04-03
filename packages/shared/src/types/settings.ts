export type AppSettings = {
  businessName: string;
  ticketFooter: string;
  posPin: string;
  tableLabels: string[];
};

export type PublicAppSettings = Omit<AppSettings, "posPin">;
