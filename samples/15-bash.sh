#!/usr/bin/env bash
# Bash: shebang, variables, command substitution, parameter expansion.
#
# Exercises: shebang comments, variable expansion, command substitution,
# parameter expansion, arithmetic, loops, conditionals, string quoting.

set -euo pipefail

readonly THEME="Adwaita Dark"
readonly BLUE="#3584e4"
readonly HEX=0x1C71D8
readonly RATIO=1.5e-9

declare -A SURFACES=(
  [view]=0
  [window]=1
  [sidebar]=2
  [dialog]=3
)

surface_list=(view window sidebar dialog)

classify() {
  local elevation="$1"
  if (( elevation < 2 )); then
    echo "recessed"
  else
    echo "raised"
  fi
}

main() {
  echo "Theme: ${THEME}"
  echo "Colour: ${BLUE} / ${THEME// /-}"

  for name in "${surface_list[@]}"; do
    local elevation="${SURFACES[$name]:-0}"
    printf '%-8s level=%d kind=%s\n' "${name}" "${elevation}" "$(classify "${elevation}")"
  done

  local count="${#SURFACES[@]}"
  echo "count=${count} first=${surface_list[0]} last=${surface_list[-1]}"

  local output
  output="$(printf '%s' "${THEME}" | tr ' ' '-')"
  echo "slug=${output} length=${#output}"

  local -i total=0
  for elevation in "${SURFACES[@]}"; do
    (( total += elevation ))
  done
  echo "total=${total}"

  case "${THEME}" in
    "Adwaita Dark" | "Adwaita Light")
      echo "matched: ${THEME}"
      ;;
    *)
      echo "no match"
      ;;
  esac

  echo "hex=$(( HEX )) ratio=${RATIO}"
  echo "escaped=tab\tnewline\nquote\"backslash\\"

  [[ -n "${THEME}" && "${THEME}" != "" ]] && echo "non-empty"
}

main "$@"
