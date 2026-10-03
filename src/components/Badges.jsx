import { CONDITION_LABEL, STATUS_LABEL } from '../utils/format';

export function StatusBadge({ status }) {
  return <span className={`badge badge--${status}`}>{STATUS_LABEL[status] || status}</span>;
}

export function ConditionBadge({ condition }) {
  return <span className={`badge badge--${condition}`}>{CONDITION_LABEL[condition] || condition}</span>;
}
