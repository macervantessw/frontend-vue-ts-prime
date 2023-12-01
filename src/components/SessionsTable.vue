<script lang="ts" setup>
import DataTable, { DataTableRowSelectEvent } from "primevue/datatable";
import Column from "primevue/column";
import ColumnGroup from "primevue/columngroup";
import Row from "primevue/row";
import { useSessionsStore } from "../store";
import router from "../router";

const sessionsStore = useSessionsStore();

const rowSelected = (event: DataTableRowSelectEvent) => {
  sessionsStore.selectedSession = event.data;
  router.push(`/sessionSummary/${event.data.SessionId}`);
};
</script>
<template>
  <DataTable :value="sessionsStore.sessions" selection-mode="single" @row-select="rowSelected">
    <ColumnGroup type="header">
      <Row>
        <Column header="Device" :colspan="2" />
        <Column header="Session" :colspan="2" />
        <Column header="Patient" :colspan="6" />
      </Row>
      <Row>
        <Column field="DeviceId" header="ID" sortable />
        <Column field="SessionDevice" header="Type" sortable />
        <Column field="SessionId" header="ID" sortable />
        <Column field="SessionType" header="Type" sortable />
        <Column field="PatientName" header="Name" sortable />
        <Column field="PatientSurname" header="Surname" sortable />
        <Column field="PAtientAge" header="Age" sortable />
        <Column field="PatientHeight" header="Height" sortable />
        <Column field="PatientBMI" header="BMI" sortable />
        <Column field="PatientWeigth" header="Patient Weigth" sortable />
      </Row>
    </ColumnGroup>
    <Column field="DeviceId" header="ID" />
    <Column field="SessionDevice" header="Type" />
    <Column field="SessionId" header="ID" />
    <Column field="SessionType" header="Type" />
    <Column field="PatientName" header="Name" />
    <Column field="PatientSurname" header="Surname" />
    <Column field="PAtientAge" header="Age" />
    <Column field="PatientHeight" header="Height" />
    <Column field="PatientBMI" header="BMI">
      <template #body="{ data }">
        <span>{{ data.PatientBMI ? data.PatientBMI.toFixed(2) : "" }}</span>
      </template></Column
    >
    <Column field="PatientWeigth" header="Patient Weigth" />
  </DataTable>
</template>
<style>
.p-datatable .p-datatable-thead > tr > th {
  border: 1px solid #dfe7ef;
}
</style>
