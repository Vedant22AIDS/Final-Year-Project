"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Database, PlugZap } from "lucide-react";
import { Button } from "../components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.tsx";
import { Input } from "../components/ui/input.tsx";
import { Label } from "../components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select.tsx";
import { Badge } from "../components/ui/badge.tsx";

interface DatabaseConnectorsPanelProps {
  onBack: () => void;
  onTestConnection?: (payload: any) => Promise<void> | void;
  onConnectAndImport?: (payload: any) => Promise<void> | void;
  disabled?: boolean;
}

const portMap: Record<string, string> = {
  postgresql: "5432",
  mysql: "3306",
  mssql: "1433",
  sqlite: "",
};

const buildDefaultQuery = (dbType: "postgresql" | "mysql" | "mssql" | "sqlite", schemaName: string, tableName: string) => {
  const table = tableName.trim();
  const schema = schemaName.trim();
  if (!table) return "SELECT *";
  if (dbType !== "sqlite" && schema) return `SELECT * FROM ${schema}.${table}`;
  return `SELECT * FROM ${table}`;
};

export function DatabaseConnectorsPanel({
  onBack,
  onTestConnection,
  onConnectAndImport,
  disabled = false,
}: DatabaseConnectorsPanelProps) {
  const [dbType, setDbType] = useState<"postgresql" | "mysql" | "mssql" | "sqlite">("postgresql");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(portMap.postgresql);
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schemaName, setSchemaName] = useState("public");
  const [tableName, setTableName] = useState("");
  const [sqlitePath, setSqlitePath] = useState("");
  const [query, setQuery] = useState("SELECT *");
  const [status, setStatus] = useState<"idle" | "testing" | "importing" | "ok" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const payload = useMemo(
    () => ({
      db_type: dbType,
      host,
      port,
      database,
      username,
      password,
      schema: schemaName,
      table: tableName,
      sqlite_path: sqlitePath,
      query: query.trim() || buildDefaultQuery(dbType, schemaName, tableName),
    }),
    [dbType, host, port, database, username, password, schemaName, tableName, sqlitePath, query],
  );

  const isSqlite = dbType === "sqlite";
  const canSubmit = isSqlite
    ? sqlitePath.trim() !== "" && tableName.trim() !== ""
    : host.trim() !== "" && database.trim() !== "" && username.trim() !== "" && tableName.trim() !== "";

  const handleDbChange = (value: string) => {
    const next = value as "postgresql" | "mysql" | "mssql" | "sqlite";
    setDbType(next);
    setPort(portMap[next]);
    if (next === "sqlite") {
      setSchemaName("");
    } else if (!schemaName) {
      setSchemaName("public");
    }
    setQuery((prev) => (prev.trim() ? prev : buildDefaultQuery(next, schemaName, tableName)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack} className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Database Connectors</h2>
      </div>

      <Card className="bg-[#121212] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-400" />
            Configure source connection
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Connector type</Label>
            <Select value={dbType} onValueChange={handleDbChange}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="mssql">SQL Server</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isSqlite && (
            <>
              <div className="space-y-2">
                <Label>Host</Label>
                <Input value={host} onChange={(e) => setHost(e.target.value)} className="bg-[#1a1a1a] border-[#2a2a2a]" />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input value={port} onChange={(e) => setPort(e.target.value)} className="bg-[#1a1a1a] border-[#2a2a2a]" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>{isSqlite ? "SQLite file path" : "Database"}</Label>
            <Input
              value={isSqlite ? sqlitePath : database}
              onChange={(e) => (isSqlite ? setSqlitePath(e.target.value) : setDatabase(e.target.value))}
              placeholder={isSqlite ? "C:\\data\\warehouse.db" : "analytics"}
              className="bg-[#1a1a1a] border-[#2a2a2a]"
            />
          </div>

          {!isSqlite && (
            <>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-[#1a1a1a] border-[#2a2a2a]" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#1a1a1a] border-[#2a2a2a]" />
              </div>
            </>
          )}

          {!isSqlite && (
            <div className="space-y-2">
              <Label>Schema</Label>
              <Input
                value={schemaName}
                onChange={(e) => {
                  const nextSchema = e.target.value;
                  setSchemaName(nextSchema);
                  if (!query.trim() || query.trim().toUpperCase() === "SELECT *" || query.includes("SELECT * FROM")) {
                    setQuery(buildDefaultQuery(dbType, nextSchema, tableName));
                  }
                }}
                className="bg-[#1a1a1a] border-[#2a2a2a]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Table</Label>
            <Input
              value={tableName}
              onChange={(e) => {
                const nextTable = e.target.value;
                setTableName(nextTable);
                if (!query.trim() || query.trim().toUpperCase() === "SELECT *" || query.includes("SELECT * FROM")) {
                  setQuery(buildDefaultQuery(dbType, schemaName, nextTable));
                }
              }}
              placeholder="orders"
              className="bg-[#1a1a1a] border-[#2a2a2a]"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Query</Label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={buildDefaultQuery(dbType, schemaName, tableName)}
              className="w-full min-h-20 rounded-md bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400">
              Default query: <code>{buildDefaultQuery(dbType, schemaName, tableName)}</code>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          disabled={disabled || !canSubmit}
          className="bg-[#1e1e1e] border-[#2a2a2a] hover:bg-[#2a2a2a]"
          onClick={async () => {
            try {
              setStatus("testing");
              setErrorMessage("");
              await onTestConnection?.(payload);
              setStatus("ok");
            } catch (error) {
              setStatus("error");
              setErrorMessage(error instanceof Error ? error.message : "Connection test failed");
            }
          }}
        >
          <PlugZap className="h-4 w-4 mr-2" />
          Test connection
        </Button>
        <Button
          disabled={disabled || !canSubmit}
          className="bg-blue-600 hover:bg-blue-700"
          onClick={async () => {
            try {
              setStatus("importing");
              setErrorMessage("");
              await onConnectAndImport?.(payload);
              setStatus("ok");
            } catch (error) {
              setStatus("error");
              setErrorMessage(error instanceof Error ? error.message : "Database import failed");
            }
          }}
        >
          Connect and Import
        </Button>
        {status !== "idle" && (
          <Badge className={status === "ok" ? "bg-green-500/20 text-green-300 border-green-600/40" : status === "testing" || status === "importing" ? "bg-yellow-500/20 text-yellow-300 border-yellow-600/40" : "bg-red-500/20 text-red-300 border-red-600/40"}>
            {status === "ok" ? "Connection OK" : status === "testing" ? "Testing..." : status === "importing" ? "Importing..." : "Connection failed"}
          </Badge>
        )}
      </div>
      {errorMessage && (
        <div className="rounded-md border border-red-600/40 bg-red-500/10 p-3 text-sm text-red-300">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

