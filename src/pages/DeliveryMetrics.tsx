import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DeliveryOverview } from "@/components/delivery/DeliveryOverview";
import { DeliveryScatterPlot } from "@/components/delivery/DeliveryScatterPlot";
import { DeliveryPullRequests } from "@/components/delivery/DeliveryPullRequests";
import { DeliveryDORADetail } from "@/components/delivery/DeliveryDORADetail";

export default function DeliveryMetrics() {
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("30d");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Delivery Metrics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Métricas detalhadas de delivery, produtividade e qualidade</p>
        </div>
        <DashboardFilters
          selectedTeam={selectedTeam}
          onTeamChange={setSelectedTeam}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="scatter" className="text-xs">Scatter Plot</TabsTrigger>
          <TabsTrigger value="pull-requests" className="text-xs">Pull Requests</TabsTrigger>
          <TabsTrigger value="dora-detail" className="text-xs">DORA Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DeliveryOverview />
        </TabsContent>

        <TabsContent value="scatter">
          <DeliveryScatterPlot />
        </TabsContent>

        <TabsContent value="pull-requests">
          <DeliveryPullRequests />
        </TabsContent>

        <TabsContent value="dora-detail">
          <DeliveryDORADetail />
        </TabsContent>
      </Tabs>
    </div>
  );
}
