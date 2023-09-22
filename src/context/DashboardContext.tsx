import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useCustomAuth } from './Auth';
import StatsTree, {
  EntryType,
  ExportStats,
  StatNode,
  StatsLevel,
} from '../helpers/statsTree';
import statsData from '../data/statsData';
import { useFirestoreDocData } from 'reactfire';
import { BranchStats, Branches, Companies, CompanyStats } from '../database';

export type ViewType = 'Day' | 'Week' | 'Month' | 'Year';

export type DashboardState = {
  viewType: StatsLevel;
  statType: EntryType;
  isCompany: boolean;
  viewDate: Date;
  sNode: StatNode;
  sTree: StatsTree;
  changeStatType: (statType: EntryType) => void;
  changeViewDate: (viewDate: Date) => void;
  changeViewType: (view: StatsLevel) => void;
};

export const DashboardContext = createContext<DashboardState>({
  viewType: StatsLevel.Day,
  viewDate: new Date(),
  isCompany: false,
  statType: 'stock',
  changeStatType: (statType: EntryType) => undefined,
  changeViewDate: (viewDate: Date) => undefined,
  changeViewType: (view: StatsLevel) => undefined,
  sNode: new StatNode(StatsLevel.Day),
  sTree: new StatsTree(),
});

export const useDashboard = () => useContext(DashboardContext);

const defaultTree = new StatsTree();

for (const entry of statsData) {
  defaultTree.addStats(entry);
}

export default function DashboardProvider({ children }: PropsWithChildren) {
  const { branch, tinnumber } = useCustomAuth();
  const [isCompany, setIsCompany] = useState(!branch);
  const [viewType, setViewType] = useState<StatsLevel>(StatsLevel.Day);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [statType, setStatType] = useState<EntryType>('stock');

  const [sTree, setStree] = useState<StatsTree>(new StatsTree());
  const [sNode, setSNode] = useState<StatNode>(
    sTree.findStatsByDate(new Date(), viewType, true) as StatNode
  );

  const companyDoc = Companies.doc(tinnumber as string);
  const query = isCompany
    ? companyDoc.sub(CompanyStats).doc('stat0').ref
    : companyDoc
        .sub(Branches)
        .doc(branch as string)
        .sub(BranchStats)
        .doc('stat0').ref;
  const { data } = useFirestoreDocData(query);

  useEffect(() => {
    if (!data) return undefined;
    const tree = StatsTree.fromObj((data.stats || data) as ExportStats);
    setStree(tree);
  }, [data]);

  useEffect(() => setIsCompany(!branch), [branch]);
  useEffect(() => {
    const node = sTree.findStatsByDate(viewDate, viewType, true) as StatNode;
    setSNode(node);
  }, [viewDate, sTree, viewType]);

  const changeViewDate = (viewDate: Date) => {
    setViewDate(viewDate);
  };
  const changeStatType = (statType: EntryType) => {
    setStatType(statType);
  };

  const changeViewType = (view: StatsLevel) => {
    setViewType(view);
  };

  return (
    <DashboardContext.Provider
      value={{
        statType,
        isCompany,
        sNode,
        viewDate,
        viewType,
        sTree,
        changeStatType,
        changeViewDate,
        changeViewType,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}
